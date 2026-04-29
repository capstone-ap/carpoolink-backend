import { saveChatMessage, getMentoringStatus } from '../database/chatRepository.js';

const activeConnections = new Map(); // userId(string) -> Set<socketId>
const socketStates = new Map(); // socketId -> { userId, userName, mentoringId }
const activeMentoringRooms = new Set(); // mentoringId(string)

function parseMentoringId(value) {
    try {
        if (value === undefined || value === null || value === '') {
            return null;
        }
        return BigInt(value);
    } catch {
        return null;
    }
}

function getRoomName(mentoringId) {
    return `mentoring:${mentoringId}`;
}

async function assertMentoringOnAir(mentoringIdInput) {
    const mentoringId = parseMentoringId(mentoringIdInput);
    if (!mentoringId) {
        return { ok: false, error: '유효하지 않은 멘토링 ID입니다.' };
    }

    const mentoring = await getMentoringStatus(mentoringId);
    if (!mentoring) {
        return { ok: false, error: '해당 멘토링이 존재하지 않습니다.' };
    }

    if (mentoring.status !== 'ON_AIR') {
        return { ok: false, error: `현재 멘토링 상태(${mentoring.status})에서는 채팅할 수 없습니다.` };
    }

    return { ok: true, mentoringId };
}

function getSocketRoomUserCount(io, mentoringId) {
    const roomName = getRoomName(mentoringId);
    const sockets = io.sockets.adapter.rooms.get(roomName);
    return sockets ? sockets.size : 0;
}

function removeSocketTracking(socketId) {
    const state = socketStates.get(socketId);
    if (!state) {
        return null;
    }

    const { userId, mentoringId } = state;
    const userKey = String(userId);
    const mentoringKey = String(mentoringId);

    if (activeConnections.has(userKey)) {
        const set = activeConnections.get(userKey);
        set.delete(socketId);
        if (set.size === 0) {
            activeConnections.delete(userKey);
        }
    }

    socketStates.delete(socketId);
    return { userId: userKey, mentoringId: mentoringKey, userName: state.userName };
}

export async function closeMentoringRoom(io, mentoringIdInput, reason = 'MENTORING_COMPLETED') {
    const mentoringId = parseMentoringId(mentoringIdInput);
    if (!mentoringId) {
        return;
    }

    const mentoringKey = mentoringId.toString();
    const roomName = getRoomName(mentoringKey);
    const sockets = await io.in(roomName).fetchSockets();

    io.to(roomName).emit('room_closed', {
        mentoringId: mentoringKey,
        reason,
        timestamp: new Date(),
    });

    for (const roomSocket of sockets) {
        removeSocketTracking(roomSocket.id);
        roomSocket.leave(roomName);
    }

    activeMentoringRooms.delete(mentoringKey);
    console.log(`[Room] Closed mentoring room ${mentoringKey} (${reason})`);
}

export async function closeCompletedMentoringRooms(io) {
    for (const mentoringId of Array.from(activeMentoringRooms)) {
        try {
            const mentoring = await getMentoringStatus(BigInt(mentoringId));
            if (!mentoring || mentoring.status === 'COMPLETED') {
                await closeMentoringRoom(io, mentoringId, 'MENTORING_COMPLETED');
            }
        } catch (error) {
            console.error(`[RoomMonitor] Failed to verify mentoring ${mentoringId}:`, error);
        }
    }
}

/**
 * Socket.io 연결 이벤트 처리
 */
export async function handleConnection(socket, io) {
    console.log(`[Socket] New connection: ${socket.id}`);

    /**
     * 채팅룸 입장
     * 클라이언트에서 전송: { mentoringId, userId, userName }
     */
    socket.on('join_chat', async (data) => {
        try {
            const { mentoringId, userId, userName } = data;

            if (!mentoringId || !userId) {
                socket.emit('error', { message: '유효하지 않은 파라미터입니다.' });
                return;
            }

            const mentoringCheck = await assertMentoringOnAir(mentoringId);
            if (!mentoringCheck.ok) {
                socket.emit('error', { message: mentoringCheck.error });
                return;
            }

            const mentoringKey = mentoringCheck.mentoringId.toString();
            const userKey = String(userId);

            const roomName = getRoomName(mentoringKey);
            socket.join(roomName);

            // 활성 연결 추적
            if (!activeConnections.has(userKey)) {
                activeConnections.set(userKey, new Set());
            }
            activeConnections.get(userKey).add(socket.id);
            socketStates.set(socket.id, {
                userId: userKey,
                userName,
                mentoringId: mentoringKey,
            });
            activeMentoringRooms.add(mentoringKey);

            // 해당 룸에 입장 알림 전송
            const userCount = getSocketRoomUserCount(io, mentoringKey);
            io.to(roomName).emit('user_joined', {
                userId: userKey,
                userName,
                userCount,
                timestamp: new Date(),
            });

            console.log(`[Chat] User ${userKey} joined room ${mentoringKey}`);
        } catch (error) {
            console.error('Error in join_chat:', error);
            socket.emit('error', { message: '채팅방에 입장하는 데 실패했습니다.' });
        }
    });

    /**
     * 채팅 메시지 수신
     * 클라이언트에서 전송: { mentoringId, userId, userName, content }
     */
    socket.on('send_message', async (data) => {
        try {
            const { mentoringId, userId, userName, content } = data;

            if (!mentoringId || !userId || !content) {
                socket.emit('error', { message: '유효하지 않은 메시지 데이터입니다.' });
                return;
            }

            // 메시지 길이 검증 (DB 스키마: VarChar(200))
            if (content.length > 200) {
                socket.emit('error', { message: '메시지 최대 길이는 200자입니다.' });
                return;
            }

            const mentoringCheck = await assertMentoringOnAir(mentoringId);
            if (!mentoringCheck.ok) {
                socket.emit('error', { message: mentoringCheck.error });
                return;
            }

            const mentoringKey = mentoringCheck.mentoringId.toString();
            const roomName = getRoomName(mentoringKey);
            if (!socket.rooms.has(roomName)) {
                socket.emit('error', { message: '먼저 채팅방에 입장해야 합니다.' });
                return;
            }

            // 데이터베이스에 메시지 저장
            const chatMessage = await saveChatMessage({
                mentoringId: mentoringCheck.mentoringId,
                userId: BigInt(userId),
                content,
            });

            // 실시간 브로드캐스트
            io.to(roomName).emit('new_message', {
                mentoringChatId: chatMessage.mentoringChatId.toString(),
                mentoringId: chatMessage.mentoringId.toString(),
                userId,
                userName,
                content,
                createdAt: chatMessage.createdAt,
            });
        } catch (error) {
            console.error('Error in send_message:', error);
            socket.emit('error', { message: '메시지를 저장하는 데 실패했습니다.' });
        }
    });

    /**
     * 채팅 메시지 히스토리 조회
     * 클라이언트에서 전송: { mentoringId, limit, offset }
     */
    socket.on('get_message_history', async (data) => {
        try {
            const { mentoringId, limit = 50, offset = 0 } = data;

            const mentoringCheck = await assertMentoringOnAir(mentoringId);
            if (!mentoringCheck.ok) {
                socket.emit('error', { message: mentoringCheck.error });
                return;
            }

            // Prisma에서 메시지 히스토리 조회
            const messages = await global.prisma.mentoringChat.findMany({
                where: { mentoringId: mentoringCheck.mentoringId },
                include: {
                    user: {
                        select: { userId: true, nickname: true },
                    },
                },
                orderBy: { createdAt: 'asc' },
                take: limit,
                skip: offset,
            });

            const formattedMessages = messages.map((msg) => ({
                mentoringChatId: msg.mentoringChatId.toString(),
                mentoringId: msg.mentoringId.toString(),
                userId: msg.userId.toString(),
                userName: msg.user.nickname,
                content: msg.content,
                createdAt: msg.createdAt,
            }));

            socket.emit('message_history', formattedMessages);
        } catch (error) {
            console.error('Error in get_message_history:', error);
            socket.emit('error', { message: '메시지 내역을 불러오는 데 실패했습니다.' });
        }
    });

    /**
     * 현재 룸의 온라인 사용자 목록 조회
     * 클라이언트에서 전송: { mentoringId }
     */
    socket.on('get_online_users', async (data) => {
        try {
            const { mentoringId } = data;

            const mentoringCheck = await assertMentoringOnAir(mentoringId);
            if (!mentoringCheck.ok) {
                socket.emit('error', { message: mentoringCheck.error });
                return;
            }

            const mentoringKey = mentoringCheck.mentoringId.toString();
            const userCount = getSocketRoomUserCount(io, mentoringKey);

            socket.emit('online_users', {
                mentoringId: mentoringKey,
                userCount,
                timestamp: new Date(),
            });

            console.log(`[Users] Mentoring ${mentoringKey} has ${userCount} online users`);
        } catch (error) {
            console.error('Error in get_online_users:', error);
            socket.emit('error', { message: '온라인 사용자 정보를 불러오는 데 실패했습니다.' });
        }
    });

    /**
     * 채팅룸 나가기
     * 클라이언트에서 전송: { mentoringId, userId, userName }
     */
    socket.on('leave_chat', async (data) => {
        try {
            const { mentoringId, userId, userName } = data;

            if (!mentoringId || !userId) {
                socket.emit('error', { message: '유효하지 않은 파라미터입니다.' });
                return;
            }

            const mentoringKey = String(mentoringId);
            const roomName = getRoomName(mentoringKey);
            socket.leave(roomName);

            // 활성 연결 제거
            removeSocketTracking(socket.id);

            // 나간 사용자 알림
            const userCount = getSocketRoomUserCount(io, mentoringKey);
            if (userCount === 0) {
                activeMentoringRooms.delete(mentoringKey);
            }

            io.to(roomName).emit('user_left', {
                userId,
                userName,
                userCount,
                timestamp: new Date(),
            });

            console.log(`[Chat] User ${userId} left room ${mentoringId}`);
        } catch (error) {
            console.error('Error in leave_chat:', error);
        }
    });

    /**
     * 연결 해제 이벤트
     */
    socket.on('disconnect', async () => {
        console.log(`[Socket] Disconnected: ${socket.id}`);

        const state = removeSocketTracking(socket.id);
        if (!state) {
            return;
        }

        const roomName = getRoomName(state.mentoringId);
        const userCount = getSocketRoomUserCount(io, state.mentoringId);
        if (userCount === 0) {
            activeMentoringRooms.delete(state.mentoringId);
        }

        io.to(roomName).emit('user_left', {
            userId: state.userId,
            userName: state.userName,
            userCount,
            timestamp: new Date(),
        });
    });

    /**
     * 오류 처리
     */
    socket.on('error', (error) => {
        console.error(`[Socket Error] ${socket.id}:`, error);
    });
}

/**
 * 특정 멘토링의 모든 클라이언트에게 메시지 브로드캐스트
 */
export function broadcastToMentoring(io, mentoringId, event, data) {
    const roomName = getRoomName(mentoringId);
    io.to(roomName).emit(event, data);
}

/**
 * 활성 연결 정보 조회
 */
export function getActiveConnections() {
    return activeConnections;
}

export function getActiveMentoringIds() {
    return Array.from(activeMentoringRooms.values());
}
