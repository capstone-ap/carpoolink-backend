import { Router } from 'express';
import { prisma } from '@carpoolink/database';
import { requireUser } from '../middleware/requireUser.js';
import { serialize } from '../utils/serialize.js';

const router = Router();

// 클라이언트가 원하는 스크립트 유형을 파싱하는 함수
function parseType(type) {
    const normalized = String(type ?? 'all').toLowerCase();

    if (normalized === 'all' || normalized === 'group' || normalized === 'one-on-one') {
        return normalized;
    }

    return 'all';
}

// 클라이언트가 참여한 멘토링 중 스크립트가 존재하는 멘토링을 찾는 함수
function buildParticipatedMentoringWhere(userId, type) {
    const where = {
        OR: [
            { userId },
            {
                participants: {
                    some: { userId },
                },
            },
        ],
    };

    if (type === 'group') {
        where.isGroup = true;
    }

    if (type === 'one-on-one') {
        where.isGroup = false;
    }

    return where;
}

// 스크립트에 마스킹 플래그가 있는지 확인하는 함수
function hasMaskedFlag(content) {
    if (!content || typeof content !== 'object') {
        return false;
    }

    return content.isMasked === true;
}

// 스크립트 조회 권한을 판단하는 함수
function canViewPrivateScript(script, viewerUserId) {
    if (!script.isPrivate) {
        return true;
    }

    // 비공개 질문 단락: 발화자 멘티(작성자)와 주관 멘토만 조회 가능
    return script.userId === viewerUserId || script.mentoring.userId === viewerUserId;
}

// 조회 권한을 확인해 마스킹/비공개 처리가 완료된 스크립트 단락을 반환하는 함수
function getVisibleContent(script, viewerUserId) {
    if (!canViewPrivateScript(script, viewerUserId)) {
        return { visible: false, reason: 'private' };
    }

    if (hasMaskedFlag(script.content)) {
        // 마스킹된 단락은 멘토/멘티 모두 원문 비노출
        return {
            visible: true,
            masked: true,
            content: {
                isMasked: true,
                message: '마스킹된 단락입니다.',
            },
        };
    }

    return {
        visible: true,
        masked: false,
        content: script.content,
    };
}

// 스크립트 단락을 클라이언트에 반환할 형태로 매핑하는 함수
function mapScriptParagraph(script, viewerUserId) {
    const visibility = getVisibleContent(script, viewerUserId);

    if (!visibility.visible) {
        return null;
    }

    return {
        scriptId: script.scriptId,
        isPrivate: script.isPrivate,
        isMasked: Boolean(visibility.masked),
        createdAt: script.createdAt,
        content: visibility.content,
        speaker: {
            userId: script.userId,
            nickname: script.user?.nickname ?? null,
            role: script.user?.role ?? null,
            isHostMentor: script.userId === script.mentoring.userId,
        },
    };
}

// [GET] /scripts - 사용자가 참여했던 멘토링 중 스크립트가 존재하는 멘토링 목록 조회
router.get('/', requireUser, async (req, res, next) => {
    try {
        // 스크립트 유형 (전체/1:N/1:1)
        const type = parseType(req.query.type);

        // 조건에 맞는 멘토링 목록 조회
        const mentorings = await prisma.mentoring.findMany({
            where: {
                ...buildParticipatedMentoringWhere(req.user.userId, type),
                scripts: {
                    some: {},
                },
            },
            include: {
                hostMentor: true,
                _count: {
                    select: {
                        scripts: true,
                    },
                },
            },
            orderBy: [{ startedAt: 'desc' }, { mentoringId: 'desc' }],
        });

        res.json(
            serialize({
                mentorings: mentorings.map((mentoring) => ({
                    mentoringId: mentoring.mentoringId,
                    title: mentoring.title,
                    startedAt: mentoring.startedAt,
                    endedAt: mentoring.endedAt ?? null,
                    isGroup: mentoring.isGroup,
                    host: {
                        userId: mentoring.hostMentor.userId,
                        nickname: mentoring.hostMentor.nickname,
                    },
                    scriptCount: mentoring._count.scripts,
                })),
            })
        );
    } catch (error) {
        next(error);
    }
});

// [GET] /scripts/{mentoringId} - 해당 멘토링의 스크립트 전문 조회
router.get('/:mentoringId', requireUser, async (req, res, next) => {
    try {
        let mentoringId;
        try {
            mentoringId = BigInt(req.params.mentoringId);
        } catch {
            return res.status(400).json({ message: '유효하지 않은 mentoringId입니다.' });
        }

        // 멘토링과 스크립트 조회 (접근 권한 및 스크립트 존재 여부 검증 포함)
        const mentoring = await prisma.mentoring.findFirst({
            where: {
                mentoringId,
                ...buildParticipatedMentoringWhere(req.user.userId),
                scripts: {
                    some: {},
                },
            },
            include: {
                hostMentor: true,
                scripts: {
                    include: {
                        user: true,
                    },
                    orderBy: [{ createdAt: 'asc' }, { scriptId: 'asc' }],
                },
            },
        });

        if (!mentoring) {
            return res.status(404).json({ message: '멘토링을 찾을 수 없거나 접근이 거부되었습니다.' });
        }

        // 스크립트 단락별로 조회 권한을 판단해 마스킹/비공개 처리를 적용한 후 반환, createdAt 기준으로 정렬
        const scripts = mentoring.scripts
            .map((script) => mapScriptParagraph({ ...script, mentoring }, req.user.userId))
            .filter(Boolean)
            .sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));

        res.json(
            serialize({
                mentoring: {
                    mentoringId: mentoring.mentoringId,
                    title: mentoring.title,
                    startedAt: mentoring.startedAt,
                    endedAt: mentoring.endedAt,
                    status: mentoring.status,
                    isGroup: mentoring.isGroup,
                    host: {
                        userId: mentoring.hostMentor.userId,
                        nickname: mentoring.hostMentor.nickname,
                    },
                },
                scripts,
            })
        );
    } catch (error) {
        next(error);
    }
});

export default router;