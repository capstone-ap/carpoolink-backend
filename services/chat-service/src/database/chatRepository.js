import { PrismaClient } from '@carpoolink/database';

const prisma = new PrismaClient();
const DEFAULT_QUESTION_SERVICE_URL = 'http://localhost:4003';

function getQuestionServiceUrl() {
    return (process.env.QUESTION_SERVICE_URL || DEFAULT_QUESTION_SERVICE_URL).replace(/\/+$/, '');
}

function getQuestionDetectionTimeoutMs() {
    const parsedValue = Number.parseInt(process.env.QUESTION_DETECTION_REQUEST_TIMEOUT_MS ?? '5000', 10);
    return Number.isFinite(parsedValue) ? parsedValue : 5000;
}

function getQuestionRankingTimeoutMs() {
    const parsedValue = Number.parseInt(process.env.QUESTION_RANKING_REQUEST_TIMEOUT_MS ?? '15000', 10);
    return Number.isFinite(parsedValue) ? parsedValue : 15000;
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

export function parseQuestionFlagsFromChatContent(content) {
    const rawContent = String(content ?? '').trim();
    const paidPrefixes = ['[유료]', '[PAID]', '[paid]', '[?좊즺]'];
    const privatePrefixes = ['[비공개]', '[PRIVATE]', '[private]'];

    let normalizedContent = rawContent;
    const isPaid = paidPrefixes.some((prefix) => {
        if (normalizedContent.startsWith(prefix)) {
            normalizedContent = normalizedContent.slice(prefix.length).trim();
            return true;
        }
        return false;
    });
    const isPrivate = privatePrefixes.some((prefix) => {
        if (normalizedContent.startsWith(prefix)) {
            normalizedContent = normalizedContent.slice(prefix.length).trim();
            return true;
        }
        return false;
    });

    return {
        content: normalizedContent || rawContent,
        isPaid,
        isPrivate,
    };
}

export async function predictQuestionText(text, { fetchImpl = globalThis.fetch } = {}) {
    if (typeof fetchImpl !== 'function') {
        throw new Error('fetch is not available for question detection.');
    }

    const timeoutMs = getQuestionDetectionTimeoutMs();
    const signal = typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
        ? AbortSignal.timeout(timeoutMs)
        : undefined;

    const response = await fetchImpl(`${getQuestionServiceUrl()}/api/question-detection/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal,
    });

    const body = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(body?.message || body?.error || 'question detection request failed');
    }

    return body;
}

export async function requestQuestionRanking(payload, { fetchImpl = globalThis.fetch } = {}) {
    if (typeof fetchImpl !== 'function') {
        throw new Error('fetch is not available for question ranking.');
    }

    const timeoutMs = getQuestionRankingTimeoutMs();
    const signal = typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
        ? AbortSignal.timeout(timeoutMs)
        : undefined;

    const response = await fetchImpl(`${getQuestionServiceUrl()}/api/questions/rank-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal,
    });

    const body = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(body?.message || body?.error || 'question ranking request failed');
    }

    return body;
}

export async function rankQuestionQueueForMentoring(mentoringId, options = {}) {
    const mentoring = await prisma.mentoring.findUnique({
        where: { mentoringId },
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
            },
            chats: {
                orderBy: { createdAt: 'asc' },
                take: 50,
            },
        },
    });

    if (!mentoring) {
        return null;
    }

    const queuedQuestions = mentoring.questions.filter(question => question.status === 'BEFORE');
    if (queuedQuestions.length === 0) {
        return {
            updatedCount: 0,
            rankedQuestions: [],
        };
    }

    const result = await requestQuestionRanking(
        buildRankingPayload({
            mentoring,
            questions: queuedQuestions,
        }),
        options,
    );
    const scoreByQuestionId = new Map(
        (result.rankedQuestions ?? []).map(question => [String(question.id), Number(question.priorityScore)]),
    );
    const updates = queuedQuestions
        .map(question => ({
            questionId: question.questionId,
            priorityScore: scoreByQuestionId.get(String(question.questionId)),
        }))
        .filter(update => Number.isFinite(update.priorityScore));

    if (updates.length > 0) {
        await prisma.$transaction(updates.map(update => prisma.question.update({
            where: { questionId: update.questionId },
            data: { priorityScore: update.priorityScore },
        })));
    }

    return {
        updatedCount: updates.length,
        ...result,
    };
}

export async function saveQuestionFromChatMessage(chatMessage, options = {}) {
    const { content, isPaid, isPrivate } = parseQuestionFlagsFromChatContent(chatMessage.content);
    const prediction = await predictQuestionText(content, options);

    if (!prediction?.is_question) {
        return {
            saved: false,
            prediction,
        };
    }

    const question = await prisma.question.create({
        data: {
            content,
            isPaid,
            isPrivate,
            userId: chatMessage.userId,
            mentoringId: chatMessage.mentoringId,
        },
    });

    return {
        saved: true,
        prediction,
        question,
    };
}

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

/**
 * 채팅 입장 권한 확인
 * - 멘토링이 존재해야 함
 * - 상태가 ON_AIR 이어야 함
 * - 주관 멘토이거나 mentoring_histories 참여자여야 함
 */
export async function verifyChatJoinAccess(mentoringId, userId) {
    try {
        const mentoring = await prisma.mentoring.findUnique({
            where: { mentoringId },
            select: {
                mentoringId: true,
                status: true,
                userId: true,
            },
        });

        if (!mentoring) {
            return { ok: false, error: '해당 멘토링이 존재하지 않습니다.' };
        }

        if (mentoring.status !== 'ON_AIR') {
            return { ok: false, error: `현재 멘토링 상태(${mentoring.status})에서는 채팅할 수 없습니다.` };
        }

        if (mentoring.userId === userId) {
            return { ok: true, mentoringId };
        }

        const history = await prisma.mentoringHistory.findFirst({
            where: {
                mentoringId,
                userId,
            },
            select: {
                mentoringHistoryId: true,
            },
        });

        if (!history) {
            return { ok: false, error: '멘토링 참여자만 채팅할 수 있습니다.' };
        }

        return { ok: true, mentoringId };
    } catch (error) {
        console.error('Error verifying chat join access:', error);
        throw error;
    }
}

export { prisma };
