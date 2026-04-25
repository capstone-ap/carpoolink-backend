import { createClient } from 'redis';

export let redisClient;
export let redisPubClient;
export let redisSubClient;

export async function initializeRedis() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    // 메인 클라이언트 (명령 실행용)
    redisClient = createClient({ url: redisUrl });
    redisClient.on('error', (err) => console.error('Redis Client Error:', err));
    await redisClient.connect();

    // Pub/Sub용 클라이언트들
    redisPubClient = createClient({ url: redisUrl });
    redisPubClient.on('error', (err) => console.error('Redis Pub Client Error:', err));
    await redisPubClient.connect();

    redisSubClient = createClient({ url: redisUrl });
    redisSubClient.on('error', (err) => console.error('Redis Sub Client Error:', err));
    await redisSubClient.connect();

    return { redisClient, redisPubClient, redisSubClient };
}

/**
 * Redis에서 활성 채팅룸 정보 조회
 */
export async function getActiveChatRoom(mentoringId) {
    const key = `chatroom:${mentoringId}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
}

/**
 * Redis에 활성 채팅룸 정보 저장
 */
export async function setActiveChatRoom(mentoringId, roomData, ttl = 3600) {
    const key = `chatroom:${mentoringId}`;
    await redisClient.setEx(key, ttl, JSON.stringify(roomData));
}

/**
 * 사용자가 속한 채팅룸 목록 조회
 */
export async function getUserChatRooms(userId) {
    const pattern = `user:rooms:${userId}`;
    const rooms = await redisClient.sMembers(pattern);
    return rooms;
}

/**
 * 사용자를 채팅룸에 추가
 */
export async function addUserToRoom(userId, mentoringId) {
    const key = `user:rooms:${userId}`;
    await redisClient.sAdd(key, mentoringId.toString());
    // 24시간 TTL 설정
    await redisClient.expire(key, 86400);
}

/**
 * 사용자를 채팅룸에서 제거
 */
export async function removeUserFromRoom(userId, mentoringId) {
    const key = `user:rooms:${userId}`;
    await redisClient.sRem(key, mentoringId.toString());
}

/**
 * 채팅룸의 온라인 사용자 수 조회
 */
export async function getRoomUserCount(mentoringId) {
    const key = `room:users:${mentoringId}`;
    const count = await redisClient.sCard(key);
    return count;
}

/**
 * 채팅룸에 사용자 추가
 */
export async function addUserToRoomSet(mentoringId, userId) {
    const key = `room:users:${mentoringId}`;
    await redisClient.sAdd(key, userId.toString());
}

/**
 * 채팅룸에서 사용자 제거
 */
export async function removeUserFromRoomSet(mentoringId, userId) {
    const key = `room:users:${mentoringId}`;
    await redisClient.sRem(key, userId.toString());
}
