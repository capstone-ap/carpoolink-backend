import { Router } from 'express';
import { prisma } from '@carpoolink/database';
import { requireUser, getUserIdFromRequest } from '../middleware/requireUser.js';
import { serialize } from '../utils/serialize.js';

const router = Router();

function isMentee(user) {
    return user.role === 'MENTEE';
}

// [GET] /surveys - 사전 설문의 질문과 선택지 조회
router.get('/', async (req, res, next) => {
    try {
        const surveyQuestions = await prisma.surveyQuestion.findMany({
            orderBy: { displayOrder: 'asc' },
            include: {
                options: {
                    orderBy: { displayOrder: 'asc' },
                },
            },
        });

        res.json(serialize({ surveyQuestions }));
    } catch (error) {
        next(error);
    }
});

// [POST] /surveys/submit - 설문 결과 제출 및 유형 판정
router.post('/submit', requireUser, async (req, res, next) => {
    try {
        // 요청 검증
        if (!isMentee(req.user)) {
            return res.status(403).json({ message: '멘티만 설문에 참여할 수 있습니다.' });
        }
        const { answers } = req.body;
        if (!answers || typeof answers !== 'object') {
            return res.status(400).json({ message: '답변 데이터가 필요합니다.' });
        }

        // 설문 질문과 선택지 조회
        const surveyQuestions = await prisma.surveyQuestion.findMany({
            orderBy: { displayOrder: 'asc' },
            include: { options: true },
        });

        const normalizedAnswers = [];
        let combinationCode = '';

        // 답변 검증 및 combinationCode 생성
        for (const question of surveyQuestions) {
            const selectedCode = answers[question.code];
            if (!selectedCode) {
                return res.status(400).json({ message: ` ${question.code}에 대한 답변이 누락되었습니다.` });
            }

            const selectedOption = question.options.find((option) => option.code === selectedCode);
            if (!selectedOption) {
                return res.status(400).json({ message: ` ${question.code}에 대한 유효하지 않은 답변입니다.` });
            }

            combinationCode += selectedOption.code;
            normalizedAnswers.push({
                question: question.code,     // 질문
                answer: selectedOption.label    // 선택지
            });
        }

        // 사전설문 결과(유형) 조회
        const result = await prisma.surveyResult.findUnique({
            where: { combinationCode },
        });
        if (!result) {
            return res.status(404).json({ message: '설문 결과를 찾을 수 없습니다.' });
        }

        // 멘티 정보 업데이트
        const mentee = await prisma.mentee.update({
            where: { userId: req.user.userId },
            data: {
                surveyResultId: result.surveyResultId,
            },
            include: {
                surveyResult: true,
            }
        });

        // 성공 응답 반환
        res.status(200).json(
            serialize({
                result: mentee.surveyResult, // ex) { combinationCode: "AABB", title: "공감형 전략자" }
                answers: normalizedAnswers   // ex) [ { question: "goal", answer: "취업 준비형" }, ... ]
            })
        );
    } catch (error) {
        next(error);
    }
});

export default router;