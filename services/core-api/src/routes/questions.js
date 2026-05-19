import { Router } from 'express';
import { prisma } from '@carpoolink/database';
import { requireUser } from '../middleware/requireUser.js';
import { serialize } from '../utils/serialize.js';
import {
    buildQuestionRecommendationPayload,
    parseSessionId,
    QuestionRecommendationProxyError,
    requestQuestionRecommendations,
    requestQuestionRanking,
} from '../lib/questionRecommendationProxy.js';

const router = Router();

function parseQueueStatus(value) {
    const normalized = String(value ?? 'BEFORE').toUpperCase();
    if (normalized === 'BEFORE' || normalized === 'ANSWERING' || normalized === 'COMPLETED') {
        return normalized;
    }

    return 'BEFORE';
}

function parseQuestionId(value) {
    try {
        if (value === undefined || value === null || value === '') {
            return null;
        }

        return BigInt(value);
    } catch {
        return null;
    }
}

function asTextList(value) {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map(item => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean);
}

function readInfoList(info, keys) {
    if (!info || typeof info !== 'object') {
        return [];
    }

    for (const key of keys) {
        if (Array.isArray(info[key])) {
            return asTextList(info[key]);
        }
    }

    return [];
}

function readInfoText(info, keys) {
    if (!info || typeof info !== 'object') {
        return '';
    }

    for (const key of keys) {
        const value = typeof info[key] === 'string' ? info[key].trim() : '';
        if (value) {
            return value;
        }
    }

    return '';
}

function textFromScriptContent(content) {
    if (typeof content === 'string') {
        return content.trim();
    }

    if (!content || typeof content !== 'object') {
        return '';
    }

    if (Array.isArray(content)) {
        return asTextList(content.map(item => {
            if (typeof item === 'string') return item;
            if (item && typeof item === 'object') return item.text ?? item.content ?? item.script ?? '';
            return '';
        })).join('\n');
    }

    return asTextList([
        content.text,
        content.content,
        content.script,
        content.summary,
    ]).join('\n');
}

function buildMentorContext(mentoring) {
    const mentorUser = mentoring.hostMentor;
    const mentorProfile = mentorUser?.mentorProfile;
    const mentorInfo = mentorProfile?.info;
    const fieldNames = mentorProfile?.fields?.map(field => field.fieldName) ?? [];
    const expertise = [...new Set([
        ...fieldNames,
        ...readInfoList(mentorInfo, ['expertise', 'skills', 'fields']),
    ])];
    const role = readInfoText(mentorInfo, ['role', 'job', 'position', 'title']) || mentorUser?.role || '';
    const bio = mentorProfile?.bio ?? '';

    return {
        mentorProfileText: [
            mentorUser?.nickname,
            role,
            expertise.join(', '),
            bio,
        ].filter(Boolean).join(' | '),
        mentorExpertiseEvidence: [
            ...expertise,
            bio,
        ].filter(Boolean),
    };
}

function buildMenteeProfileText(mentoring) {
    return (mentoring.participants ?? [])
        .map(participant => {
            const user = participant.user;
            if (!user || user.role !== 'MENTEE') {
                return '';
            }

            return [
                user.nickname,
                user.role,
                user.menteeProfile?.surveyResult?.title,
            ].filter(Boolean).join(' | ');
        })
        .filter(Boolean)
        .join('\n');
}

function buildRankingPayload({ mentoring, questions }) {
    const scripts = mentoring.scripts ?? [];
    const scriptTexts = scripts
        .map(script => textFromScriptContent(script.content))
        .filter(Boolean);
    const answeredQuestions = (mentoring.questions ?? [])
        .filter(question => question.status === 'COMPLETED')
        .map(question => question.content);
    const recentMentorUtterances = (mentoring.chats ?? [])
        .filter(chat => chat.userId === mentoring.userId)
        .slice(-5)
        .map(chat => chat.content);
    const { mentorProfileText, mentorExpertiseEvidence } = buildMentorContext(mentoring);

    return {
        questions: questions.map(question => ({
            id: String(question.questionId),
            text: question.content,
            isPaid: question.isPaid,
            createdAt: question.createdAt,
            userId: String(question.userId),
        })),
        sessionTopic: mentoring.title,
        previousScriptSections: scriptTexts.slice(0, -1),
        currentScriptSection: scriptTexts.at(-1) ?? '',
        answeredQuestions,
        queuedQuestions: questions.map(question => question.content),
        recentMentorUtterances,
        menteeProfile: buildMenteeProfileText(mentoring),
        mentorProfile: mentorProfileText,
        mentorExpertiseEvidence,
        mentorPastScripts: scriptTexts,
    };
}

function buildRecommendationRequestBody({ body, mentoring }) {
    const scripts = mentoring.scripts ?? [];
    const scriptTexts = scripts
        .map(script => textFromScriptContent(script.content))
        .filter(Boolean);
    const chats = mentoring.chats ?? [];
    const questions = mentoring.questions ?? [];
    const answeredQuestions = questions
        .filter(question => question.status === 'COMPLETED')
        .map(question => question.content);
    const queuedQuestions = questions
        .filter(question => question.status === 'BEFORE' || question.status === 'ANSWERING')
        .map(question => question.content);
    const recentMentorUtterances = chats
        .filter(chat => chat.userId === mentoring.userId)
        .slice(-5)
        .map(chat => chat.content);
    const recentChatContext = chats
        .slice(-8)
        .map(chat => `${chat.user?.nickname ?? 'user'}: ${chat.content}`)
        .join('\n');
    const explicitContext = typeof body?.context === 'string' ? body.context.trim() : '';
    const dbContext = [
        `Session topic: ${mentoring.title}`,
        scriptTexts.at(-1) ? `Current script section:\n${scriptTexts.at(-1)}` : '',
        recentChatContext ? `Recent chat:\n${recentChatContext}` : '',
        queuedQuestions.length > 0 ? `Queued questions:\n${queuedQuestions.join('\n')}` : '',
    ].filter(Boolean).join('\n\n');
    const answerabilityContext = body?.answerabilityContext && typeof body.answerabilityContext === 'object'
        ? body.answerabilityContext
        : {};

    return {
        ...body,
        context: explicitContext || dbContext || mentoring.title,
        topic: body?.topic || mentoring.title,
        answerabilityContext: {
            ...answerabilityContext,
            previousScriptSections: answerabilityContext.previousScriptSections ?? scriptTexts.slice(0, -1),
            currentScriptSection: answerabilityContext.currentScriptSection ?? scriptTexts.at(-1) ?? '',
            recentMentorUtterances: answerabilityContext.recentMentorUtterances ?? recentMentorUtterances,
            answeredQuestions: answerabilityContext.answeredQuestions ?? answeredQuestions,
            queuedQuestions: answerabilityContext.queuedQuestions ?? queuedQuestions,
        },
    };
}

function truncateRecommendationContent(content) {
    const value = typeof content === 'string' ? content.trim() : '';
    return value.length > 150 ? value.slice(0, 150) : value;
}

async function updateQuestionStatusForHost(req, res, next, status) {
    try {
        const questionId = parseQuestionId(req.params.questionId);
        if (questionId === null) {
            return res.status(400).json({
                code: 'QUESTION_INVALID_ID',
                message: 'valid questionId is required',
            });
        }

        const question = await prisma.question.findFirst({
            where: {
                questionId,
                mentoring: {
                    userId: req.user.userId,
                },
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

        if (!question) {
            return res.status(404).json({
                code: 'QUESTION_NOT_FOUND',
                message: 'question not found or access denied',
            });
        }

        if (question.status === 'COMPLETED' && status === 'ANSWERING') {
            return res.status(409).json({
                code: 'QUESTION_ALREADY_COMPLETED',
                message: 'completed question cannot be moved back to answering',
            });
        }

        const updatedQuestion = await prisma.question.update({
            where: { questionId },
            data: { status },
            include: {
                user: {
                    select: {
                        userId: true,
                        nickname: true,
                    },
                },
            },
        });

        return res.json(serialize({
            question: {
                questionId: updatedQuestion.questionId,
                content: updatedQuestion.content,
                isPaid: updatedQuestion.isPaid,
                isPrivate: updatedQuestion.isPrivate,
                priorityScore: updatedQuestion.priorityScore,
                status: updatedQuestion.status,
                createdAt: updatedQuestion.createdAt,
                user: {
                    userId: updatedQuestion.user.userId,
                    nickname: updatedQuestion.user.nickname,
                },
            },
        }));
    } catch (error) {
        next(error);
    }
}

router.get('/', requireUser, async (req, res, next) => {
    try {
        const mentoringId = parseSessionId(req.query.mentoringId ?? req.query.sessionId);
        const status = parseQueueStatus(req.query.status);

        const mentoring = await prisma.mentoring.findFirst({
            where: {
                mentoringId,
                OR: [
                    { userId: req.user.userId },
                    {
                        participants: {
                            some: { userId: req.user.userId },
                        },
                    },
                ],
            },
            select: { mentoringId: true },
        });

        if (!mentoring) {
            return res.status(404).json({
                code: 'QUESTION_QUEUE_SESSION_NOT_FOUND',
                message: 'mentoring session not found or access denied',
            });
        }

        const questions = await prisma.question.findMany({
            where: {
                mentoringId,
                status,
            },
            include: {
                user: {
                    select: {
                        userId: true,
                        nickname: true,
                    },
                },
            },
            orderBy: [
                { isPaid: 'desc' },
                { priorityScore: 'desc' },
                { createdAt: 'asc' },
                { questionId: 'asc' },
            ],
        });

        return res.json(serialize({
            questions: questions.map((question) => ({
                questionId: question.questionId,
                content: question.content,
                isPaid: question.isPaid,
                isPrivate: question.isPrivate,
                priorityScore: question.priorityScore,
                status: question.status,
                createdAt: question.createdAt,
                user: {
                    userId: question.user.userId,
                    nickname: question.user.nickname,
                },
            })),
        }));
    } catch (error) {
        if (error instanceof QuestionRecommendationProxyError) {
            return res.status(error.status).json({
                code: 'QUESTION_QUEUE_INVALID_REQUEST',
                message: error.message,
            });
        }

        next(error);
    }
});

router.patch('/:questionId/answering', requireUser, (req, res, next) => {
    return updateQuestionStatusForHost(req, res, next, 'ANSWERING');
});

router.patch('/:questionId/completed', requireUser, (req, res, next) => {
    return updateQuestionStatusForHost(req, res, next, 'COMPLETED');
});

router.post('/rank-queue', requireUser, async (req, res, next) => {
    try {
        const mentoringId = parseSessionId(req.body?.mentoringId ?? req.body?.sessionId);
        const mentoring = await prisma.mentoring.findFirst({
            where: {
                mentoringId,
                userId: req.user.userId,
            },
            include: {
                hostMentor: {
                    include: {
                        mentorProfile: {
                            include: { fields: true },
                        },
                    },
                },
                participants: {
                    include: {
                        user: {
                            include: {
                                menteeProfile: {
                                    include: { surveyResult: true },
                                },
                            },
                        },
                    },
                },
                scripts: {
                    orderBy: { createdAt: 'asc' },
                    take: 5,
                },
                questions: {
                    where: {
                        OR: [
                            { status: 'BEFORE' },
                            { status: 'COMPLETED' },
                        ],
                    },
                    orderBy: { createdAt: 'asc' },
                    include: {
                        user: {
                            select: {
                                userId: true,
                                nickname: true,
                            },
                        },
                    },
                },
                chats: {
                    include: {
                        user: {
                            select: {
                                nickname: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                    take: 50,
                },
            },
        });

        if (!mentoring) {
            return res.status(404).json({
                code: 'QUESTION_RANKING_SESSION_NOT_FOUND',
                message: 'mentoring session not found or access denied',
            });
        }

        const queuedQuestions = mentoring.questions.filter(question => question.status === 'BEFORE');
        if (queuedQuestions.length === 0) {
            return res.json(serialize({
                updatedCount: 0,
                questions: [],
            }));
        }

        const result = await requestQuestionRanking(buildRankingPayload({
            mentoring,
            questions: queuedQuestions,
        }));

        const scoreByQuestionId = new Map(
            (result.rankedQuestions ?? []).map(question => [String(question.id), Number(question.priorityScore)]),
        );

        const updates = queuedQuestions
            .map(question => ({
                questionId: question.questionId,
                priorityScore: scoreByQuestionId.get(String(question.questionId)),
            }))
            .filter(update => Number.isFinite(update.priorityScore));

        await prisma.$transaction(updates.map(update => prisma.question.update({
            where: { questionId: update.questionId },
            data: { priorityScore: update.priorityScore },
        })));
        const queuedQuestionById = new Map(
            queuedQuestions.map(question => [String(question.questionId), question]),
        );

        return res.json(serialize({
            updatedCount: updates.length,
            questions: (result.rankedQuestions ?? []).map(question => ({
                questionId: question.id,
                content: queuedQuestionById.get(String(question.id))?.content ?? question.text,
                isPaid: queuedQuestionById.get(String(question.id))?.isPaid ?? question.isPaid,
                isPrivate: queuedQuestionById.get(String(question.id))?.isPrivate ?? false,
                status: queuedQuestionById.get(String(question.id))?.status ?? 'BEFORE',
                createdAt: queuedQuestionById.get(String(question.id))?.createdAt ?? null,
                user: queuedQuestionById.get(String(question.id))?.user ?? null,
                priorityScore: question.priorityScore,
                answerabilityScore: question.answerabilityScore,
                priorityTier: question.priorityTier,
                priorityGroup: question.priorityGroup,
                clusterId: question.clusterId,
                clusterSize: question.clusterSize,
                similarQuestionIds: question.similarQuestionIds ?? [],
                scores: question.scores ?? null,
            })),
            clustering: result.clustering ?? null,
        }));
    } catch (error) {
        if (error instanceof QuestionRecommendationProxyError) {
            return res.status(error.status).json({
                code: error.code,
                message: error.message,
            });
        }

        next(error);
    }
});

router.post('/recommendations', requireUser, async (req, res, next) => {
    try {
        const mentoringId = parseSessionId(req.body?.sessionId);
        const mentoring = await prisma.mentoring.findFirst({
            where: {
                mentoringId,
                OR: [
                    { userId: req.user.userId },
                    {
                        participants: {
                            some: { userId: req.user.userId },
                        },
                    },
                ],
            },
            include: {
                hostMentor: {
                    include: {
                        mentorProfile: {
                            include: { fields: true },
                        },
                    },
                },
                participants: {
                    include: {
                        user: {
                            include: {
                                menteeProfile: {
                                    include: { surveyResult: true },
                                },
                            },
                        },
                    },
                },
                scripts: {
                    orderBy: { createdAt: 'asc' },
                    take: 5,
                },
                questions: {
                    orderBy: { createdAt: 'asc' },
                    take: 50,
                },
                chats: {
                    include: {
                        user: {
                            select: {
                                nickname: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                    take: 50,
                },
            },
        });

        if (!mentoring) {
            return res.status(404).json({
                code: 'QUESTION_RECOMMENDATION_SESSION_NOT_FOUND',
                message: 'mentoring session not found or access denied',
            });
        }

        const payload = buildQuestionRecommendationPayload({
            body: buildRecommendationRequestBody({
                body: req.body ?? {},
                mentoring,
            }),
            mentoring,
            currentUserId: req.user.userId,
        });
        const result = await requestQuestionRecommendations(payload);
        const recommendations = result.questions ?? [];

        const rows = recommendations
            .map(question => ({
                mentoringId,
                content: truncateRecommendationContent(question.content),
            }))
            .filter(row => row.content);

        if (rows.length > 0) {
            await prisma.aiRecommendation.createMany({
                data: rows,
            });
        }

        return res.json(serialize({
            questions: recommendations,
        }));
    } catch (error) {
        if (error instanceof QuestionRecommendationProxyError) {
            return res.status(error.status).json({
                code: error.code,
                message: error.message,
            });
        }

        next(error);
    }
});

export default router;
