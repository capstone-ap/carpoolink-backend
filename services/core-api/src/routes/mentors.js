import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { serialize } from '../utils/serialize.js';

const router = Router();

// 멘토 정보 매핑 함수
function mapMentor(mentor) {
    return {
        mentorId: mentor.mentorId,
        userId: mentor.userId,
        nickname: mentor.user.nickname,
        email: mentor.user.email,
        bio: mentor.bio,
        info: mentor.info,
        price: mentor.price,
        fields: mentor.MentorField.map((mentorField) => mentorField.field.fieldName),
        updatedAt: mentor.updatedAt,
    };
}

// 멘토 목록 조회 엔드포인트
router.get('/', async (res, next) => {
    try {
        const mentors = await prisma.mentor.findMany({
            include: {
                user: true,
                MentorField: {
                    include: {
                        field: true,
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });

        res.json(serialize({ mentors: mentors.map(mapMentor) }));
    } catch (error) {
        next(error);
    }
});

// 특정 멘토 상세 조회 엔드포인트
router.get('/:mentorId', async (req, res, next) => {
    try {
        const mentorId = BigInt(req.params.mentorId);

        const mentor = await prisma.mentor.findUnique({
            where: { mentorId },
            include: {
                user: true,
                MentorField: {
                    include: {
                        field: true,
                    },
                },
            },
        });

        if (!mentor) {
            return res.status(404).json({ message: 'Mentor not found.' });
        }

        res.json(serialize({ mentor: mapMentor(mentor) }));
    } catch (error) {
        if (error instanceof SyntaxError || error instanceof RangeError) {
            return res.status(400).json({ message: 'Invalid mentorId.' });
        }

        next(error);
    }
});

export default router;