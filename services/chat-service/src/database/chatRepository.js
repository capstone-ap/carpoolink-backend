import { PrismaClient } from '@carpoolink/database';

const prisma = new PrismaClient();

/**
 * 채팅 메시지 저장
 */
export async function saveChatMessage({ mentoringId, userId, content }) {
    try {
        const message = await prisma.mentoringChat.create({
            data: {
                content,
                userId,
                mentoringId,
            },
            include: {
                user: {
                    select: {
                        userId: true,
                        nickname: true,
                    },
                },
            },
        });

        return message;
    } catch (error) {
        console.error('Error saving chat message:', error);
        throw error;
    }
}

/**
 * 멘토링의 채팅 메시지 조회
 */
export async function getChatMessages(mentoringId, limit = 50, offset = 0) {
    try {
        const messages = await prisma.mentoringChat.findMany({
            where: { mentoringId },
            include: {
                user: {
                    select: {
                        userId: true,
                        nickname: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
            take: limit,
            skip: offset,
        });

        return messages;
    } catch (error) {
        console.error('Error fetching chat messages:', error);
        throw error;
    }
}

/**
 * 멘토링의 메시지 총 개수 조회
 */
export async function getChatMessageCount(mentoringId) {
    try {
        const count = await prisma.mentoringChat.count({
            where: { mentoringId },
        });

        return count;
    } catch (error) {
        console.error('Error counting chat messages:', error);
        throw error;
    }
}

/**
 * 멘토링 참여자 조회
 */
export async function getUsersInMentoring(mentoringId) {
    try {
        const mentoring = await prisma.mentoring.findUnique({
            where: { mentoringId },
            include: {
                hostMentor: {
                    select: {
                        userId: true,
                        nickname: true,
                    },
                },
                participants: {
                    include: {
                        user: {
                            select: {
                                userId: true,
                                nickname: true,
                            },
                        },
                    },
                },
            },
        });

        if (!mentoring) {
            return [];
        }

        const users = [mentoring.hostMentor];
        for (const participant of mentoring.participants) {
            users.push(participant.user);
        }

        return users;
    } catch (error) {
        console.error('Error fetching mentoring users:', error);
        throw error;
    }
}

/**
 * 멘토링 상태 확인
 */
export async function getMentoringStatus(mentoringId) {
    try {
        const mentoring = await prisma.mentoring.findUnique({
            where: { mentoringId },
            select: {
                mentoringId: true,
                title: true,
                isGroup: true,
                status: true,
                startedAt: true,
                endedAt: true,
                userId: true,
            },
        });

        return mentoring;
    } catch (error) {
        console.error('Error fetching mentoring status:', error);
        throw error;
    }
}

export { prisma };
