import { Router } from 'express';
import { prisma } from '@carpoolink/database';
import { getUserIdFromRequest, requireUser } from '../middleware/requireUser.js';
import { serialize } from '../utils/serialize.js';

const router = Router();

// [GET] /users/exists - 사용자 존재 여부 확인
router.get('/exists', async (req, res, next) => {
    try {
        const userId = getUserIdFromRequest(req);

        if (userId === null) {
            return res.status(400).json({ message: 'x-user-id header가 필요합니다.' });
        }

        const user = await prisma.user.findUnique({
            where: { userId },
            select: { userId: true, nickname: true, role: true },
        });

        res.json(
            serialize({
                exists: Boolean(user),
                user,
            })
        );
    } catch (error) {
        next(error);
    }
});

// [GET] /users/me - 현재 사용자 정보 조회
router.get('/me', requireUser, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { userId: req.user.userId },
            include: {
                menteeProfile: {
                    include: {
                        surveyResult: true,
                    },
                },
                mentorProfile: {
                    include: {
                        fields: true,
                    },
                },
            },
        });

        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        res.json(
            serialize({
                userId: user.userId,
                email: user.email,
                nickname: user.nickname,
                role: user.role,
                // 멘티 정보
                menteeProfile: user.menteeProfile
                    ? {
                        menteeId: user.menteeProfile.menteeId,
                        balance: user.menteeProfile?.balance ?? 0,
                        surveyResult: user.menteeProfile?.surveyResult?.title ?? null,
                    }
                    : null,
                // 멘토 정보
                mentorProfile: user.mentorProfile
                    ? {
                        mentorId: user.mentorProfile.mentorId,
                        bio: user.mentorProfile.bio,
                    }
                    : null,
            })
        );
    } catch (error) {
        next(error);
    }
});

export default router;