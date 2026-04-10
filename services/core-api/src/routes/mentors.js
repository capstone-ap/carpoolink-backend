import { Router } from 'express';
import { prisma } from '@carpoolink/database';
import { serialize } from '../utils/serialize.js';

const router = Router();

// 멘토 정보 매핑 함수
function mapMentor(mentor) {
    return {
        mentorId: mentor.mentorId,
        userId: mentor.userId,
        nickname: mentor.user.nickname,
        price: mentor.price,
        fields: mentor.fields.map((field) => field.fieldName),
        updatedAt: mentor.updatedAt,
    };
}

// 멘토 상세 정보 매핑 함수
function mapMentorDetail(mentor) {
    return {
        mentorId: mentor.mentorId,
        userId: mentor.userId,
        nickname: mentor.user.nickname,
        bio: mentor.bio,
        info: mentor.info,
        price: mentor.price,
        fields: mentor.fields.map((field) => field.fieldName),
        updatedAt: mentor.updatedAt,
    };
}

// [GET] /mentors - 전체 멘토 목록 조회
router.get('/', async (req, res, next) => {
    try {
        const mentors = await prisma.mentor.findMany({
            include: {
                user: true,
                fields: true,
            },
            orderBy: { updatedAt: 'desc' },
        });

        res.json(serialize({ mentors: mentors.map(mapMentor) }));
    } catch (error) {
        next(error);
    }
});

// [GET] /mentors/:mentorId - 특정 멘토 상세 정보 조회
router.get('/:mentorId', async (req, res, next) => {
    try {
        const mentorId = BigInt(req.params.mentorId);

        const mentor = await prisma.mentor.findUnique({
            where: { mentorId },
            include: {
                user: true,
                fields: true,
            },
        });

        if (!mentor) {
            return res.status(404).json({ message: '멘토를 찾을 수 없습니다.' });
        }

        res.json(serialize({ mentor: mapMentorDetail(mentor) }));
    } catch (error) {
        if (error instanceof SyntaxError || error instanceof RangeError) {
            return res.status(400).json({ message: '유효하지 않은 mentorId입니다.' });
        }

        next(error);
    }
});

export default router;