import {
    redisPubClient,
    redisSubClient,
    addUserToRoom,
    removeUserFromRoom,
    addUserToRoomSet,
    removeUserFromRoomSet,
    getRoomUserCount,
} from '../redis/redisClient.js';
import { saveChatMessage, getUsersInMentoring } from '../database/chatRepository.js';

// 활성 Socket 연결 저장
const activeConnections = new Map(); // userId -> Set of socket ids

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

            // Socket을 특정 룸에 추가
            const roomName = `mentoring:${mentoringId}`;
            socket.join(roomName);

            // Redis에 사용자 정보 저장
            await addUserToRoom(userId, mentoringId);
            await addUserToRoomSet(mentoringId, userId);

            // 활성 연결 추적
            if (!activeConnections.has(userId)) {
                activeConnections.set(userId, new Set());
            }
            activeConnections.get(userId).add(socket.id);

            // 해당 룸에 입장 알림 전송
            const userCount = await getRoomUserCount(mentoringId);
            io.to(roomName).emit('user_joined', {
                userId,
                userName,
                userCount,
                timestamp: new Date(),
            });

            console.log(`[Chat] User ${userId} joined room ${mentoringId}`);
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

            // 데이터베이스에 메시지 저장
            const chatMessage = await saveChatMessage({
                mentoringId: BigInt(mentoringId),
                userId: BigInt(userId),
                content,
            });

            // 실시간 브로드캐스트
            const roomName = `mentoring:${mentoringId}`;
            io.to(roomName).emit('new_message', {
                mentoringChatId: chatMessage.mentoringChatId.toString(),
                mentoringId: chatMessage.mentoringId.toString(),
                userId,
                userName,
                content,
                createdAt: chatMessage.createdAt,
            });

            // Redis Pub/Sub를 통한 메시지 전파 (다중 서버 환경 지원)
            await redisPubClient.publish(
                `mentoring:${mentoringId}`,
                JSON.stringify({
                    type: 'message',
                    data: {
                        mentoringChatId: chatMessage.mentoringChatId.toString(),
                        mentoringId: chatMessage.mentoringId.toString(),
                        userId,
                        userName,
                        content,
                        createdAt: chatMessage.createdAt,
                    },
                })
            );
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

            if (!mentoringId) {
                socket.emit('error', { message: '유효하지 않은 멘토링 ID입니다.' });
                return;
            }

            // Prisma에서 메시지 히스토리 조회
            const messages = await global.prisma.mentoringChat.findMany({
                where: { mentoringId: BigInt(mentoringId) },
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

            if (!mentoringId) {
                socket.emit('error', { message: '유효하지 않은 멘토링 ID입니다.' });
                return;
            }

            // Redis에서 온라인 사용자 조회
            const roomName = `mentoring:${mentoringId}`;
            const sockets = io.sockets.adapter.rooms.get(roomName);
            const userCount = sockets ? sockets.size : 0;

            socket.emit('online_users', {
                mentoringId,
                userCount,
                timestamp: new Date(),
            });

            console.log(`[Users] Mentoring ${mentoringId} has ${userCount} online users`);
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

            const roomName = `mentoring:${mentoringId}`;
            socket.leave(roomName);

            // Redis에서 사용자 정보 제거
            await removeUserFromRoom(userId, mentoringId);
            await removeUserFromRoomSet(mentoringId, userId);

            // 활성 연결 제거
            if (activeConnections.has(userId)) {
                activeConnections.get(userId).delete(socket.id);
                if (activeConnections.get(userId).size === 0) {
                    activeConnections.delete(userId);
                }
            }

            // 나간 사용자 알림
            const userCount = await getRoomUserCount(mentoringId);
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
        // 활성 연결에서 제거
        for (const [userId, sockets] of activeConnections.entries()) {
            if (sockets.has(socket.id)) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    activeConnections.delete(userId);
                }
            }
        }
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
    const roomName = `mentoring:${mentoringId}`;
    io.to(roomName).emit(event, data);
}

/**
 * 활성 연결 정보 조회
 */
export function getActiveConnections() {
    return activeConnections;
}
