import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { getUserIdFromRequest, requireUser } from '../middleware/requireUser.js';
import { serialize } from '../utils/serialize.js';

const router = Router();

// 사용자 존재 여부 조회 엔드포인트
router.get('/exists', async (req, res, next) => {
    try {
        const userId = getUserIdFromRequest(req);

        if (userId === null) {
            return res.status(400).json({ message: 'x-user-id header is required.' });
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

// 현재 사용자 정보 조회 엔드포인트
router.get('/me', requireUser, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { userId: req.user.userId },
            include: {
                menteeProfile: true,
                mentorProfile: {
                    include: {
                        MentorField: {
                            include: {
                                field: true,
                            },
                        },
                    },
                },
                surveySubmission: {
                    include: {
                        resultType: true,
                    },
                },
            },
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json(
            serialize({
                userId: user.userId,
                email: user.email,
                nickname: user.nickname,
                role: user.role,
                balance: user.menteeProfile?.balance ?? 0,
                surveyData: user.menteeProfile?.surveyData ?? null,
                surveyResult: user.surveySubmission?.resultType ?? null,
                mentorProfile: user.mentorProfile
                    ? {
                        mentorId: user.mentorProfile.mentorId,
                        bio: user.mentorProfile.bio,
                        info: user.mentorProfile.info,
                        price: user.mentorProfile.price,
                        fields: user.mentorProfile.MentorField.map((mentorField) => mentorField.field.fieldName),
                    }
                    : null,
            })
        );
    } catch (error) {
        next(error);
    }
});

export default router;