import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireUser } from '../middleware/requireUser.js';
import { serialize } from '../utils/serialize.js';

const router = Router();

// 클라이언트가 원하는 1:N 멘토링 상태를 파싱하는 함수
function parseMentoringStatus(status) {
    if (!status) {
        return 'ON_AIR';
    }

    const normalized = String(status).toUpperCase();

    if (normalized === 'READY' || normalized === 'ON_AIR' || normalized === 'COMPLETED') {
        return normalized;
    }

    return 'ON_AIR';
}

// 1:N 멘토링 목록 조회 엔드포인트
router.get('/group', async (req, res, next) => {
    try {
        // 상태 파라미터 읽기 (기본값: ON_AIR)
        const status = parseMentoringStatus(req.query.status);

        // 조건에 맞는 멘토링 목록 조회
        const mentorings = await prisma.mentoring.findMany({
            where: {
                isGroup: true,
                ...(status ? { status } : {}),
            },
            include: {
                hostMentor: true,
                participants: {
                    include: {
                        user: true,
                    },
                },
            },
            orderBy: [{ startedAt: 'desc' }, { mentoringId: 'desc' }],
        });

        // 응답 직렬화 및 전송
        res.json(
            serialize({
                mentorings: mentorings.map((mentoring) => ({
                    mentoringId: mentoring.mentoringId,
                    title: mentoring.title,
                    status: mentoring.status,
                    startedAt: mentoring.startedAt,
                    endedAt: mentoring.endedAt,
                    host: {
                        userId: mentoring.hostMentor.userId,
                        nickname: mentoring.hostMentor.nickname,
                    },
                    participantCount: mentoring.participants.length,
                })),
            })
        );
    } catch (error) {
        next(error);
    }
});

// 1:1 멘토링 상대 목록 조회 엔드포인트
router.get('/one-on-one/peers', requireUser, async (req, res, next) => {
    try {
        // 현재 사용자가 참여한 1:1 멘토링 목록 조회
        const mentorings = await prisma.mentoring.findMany({
            where: {
                isGroup: false,
                participants: {
                    some: {
                        userId: req.user.userId,
                    },
                },
            },
            include: {
                participants: {
                    include: {
                        user: true,
                    },
                },
            },
            orderBy: [{ startedAt: 'desc' }, { mentoringId: 'desc' }],
        });

        const peers = new Map();

        // 각 멘토링에서 상대방 정보 추출
        for (const mentoring of mentorings) {
            const counterpart = mentoring.participants.find((participant) => participant.userId !== req.user.userId);

            if (!counterpart) {
                continue;
            }

            const counterpartKey = counterpart.user.userId.toString();

            if (!peers.has(counterpartKey)) {
                peers.set(counterpartKey, {
                    userId: counterpart.user.userId,
                    nickname: counterpart.user.nickname,
                    role: counterpart.user.role,
                    lastMentoring: {
                        mentoringId: mentoring.mentoringId,
                        title: mentoring.title,
                        status: mentoring.status,
                        startedAt: mentoring.startedAt,
                        endedAt: mentoring.endedAt,
                    },
                });
            }
        }

        res.json(
            serialize({
                peers: Array.from(peers.values()),
            })
        );
    } catch (error) {
        next(error);
    }
});

export default router;