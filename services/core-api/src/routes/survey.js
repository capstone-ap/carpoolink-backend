import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireUser } from '../middleware/requireUser.js';
import { serialize } from '../utils/serialize.js';

const router = Router();

// 설문 질문과 결과 유형 조회 엔드포인트
router.get('/', async (req, res, next) => {
    try {
        const questions = await prisma.surveyQuestion.findMany({
            orderBy: { displayOrder: 'asc' },
            include: {
                options: {
                    orderBy: { displayOrder: 'asc' },
                },
            },
        });

        const resultTypes = await prisma.surveyResultType.findMany({
            orderBy: { combinationKey: 'asc' },
        });

        res.json(
            serialize({
                questions,
                resultTypes,
            })
        );
    } catch (error) {
        next(error);
    }
});

// 설문 결과 제출 엔드포인트
router.post('/results', requireUser, async (req, res, next) => {
    try {
        const { answers } = req.body ?? {};

        if (!answers || typeof answers !== 'object') {
            return res.status(400).json({ message: 'answers object is required.' });
        }

        const questions = await prisma.surveyQuestion.findMany({
            orderBy: { displayOrder: 'asc' },
            include: {
                options: {
                    orderBy: { displayOrder: 'asc' },
                },
            },
        });

        if (questions.length === 0) {
            return res.status(503).json({ message: 'Survey questions are not configured.' });
        }

        const normalizedAnswers = [];
        let combinationKey = '';

        for (const question of questions) {
            const selectedCode = answers[question.code];

            if (!selectedCode) {
                return res.status(400).json({ message: `Missing answer for ${question.code}.` });
            }

            const selectedOption = question.options.find((option) => option.code === selectedCode);

            if (!selectedOption) {
                return res.status(400).json({ message: `Invalid answer for ${question.code}.` });
            }

            combinationKey += selectedOption.code;
            normalizedAnswers.push({
                questionCode: question.code,
                question: question.content,
                optionCode: selectedOption.code,
                optionLabel: selectedOption.label,
            });
        }

        const resultType = await prisma.surveyResultType.findUnique({
            where: { combinationKey },
        });

        if (!resultType) {
            return res.status(404).json({ message: 'Survey result type not found for this combination.' });
        }

        const submission = await prisma.surveySubmission.upsert({
            where: { userId: req.user.userId },
            update: {
                answers: normalizedAnswers,
                combinationKey,
                surveyResultTypeId: resultType.surveyResultTypeId,
            },
            create: {
                userId: req.user.userId,
                answers: normalizedAnswers,
                combinationKey,
                surveyResultTypeId: resultType.surveyResultTypeId,
            },
            include: {
                resultType: true,
            },
        });

        res.status(201).json(
            serialize({
                submission,
            })
        );
    } catch (error) {
        next(error);
    }
});

export default router;