import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
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

// 스크립트 정보 매핑 함수
function mapScript(script) {
    return {
        scriptId: script.scriptId,
        content: script.content,
        isPrivate: script.isPrivate,
        createdAt: script.createdAt,
        author: {
            userId: script.user.userId,
            nickname: script.user.nickname,
            role: script.user.role,
        },
        mentoring: {
            mentoringId: script.mentoring.mentoringId,
            title: script.mentoring.title,
            isGroup: script.mentoring.isGroup,
            status: script.mentoring.status,
        },
    };
}

// 스크립트 목록 조회 엔드포인트
router.get('/', async (req, res, next) => {
    try {
        const type = parseType(req.query.type);

        // 모든 스크립트 조회 (필터링은 메모리에서 수행)
        const scripts = await prisma.script.findMany({
            include: {
                user: true,
                mentoring: true,
            },
            orderBy: [{ createdAt: 'desc' }, { scriptId: 'desc' }],
        });

        // 유형에 따라 스크립트 필터링
        const filteredScripts = scripts.filter((script) => {
            if (type === 'group') {
                return script.mentoring.isGroup;
            }

            if (type === 'one-on-one') {
                return !script.mentoring.isGroup;
            }

            return true;
        });

        res.json(
            serialize({
                scripts: filteredScripts.map(mapScript),
            })
        );
    } catch (error) {
        next(error);
    }
});

// 참여한 멘토링의 스크립트 목록 조회 엔드포인트
router.get('/participated', requireUser, async (req, res, next) => {
    try {
        const type = parseType(req.query.type);

        // 현재 사용자가 참여한 멘토링의 스크립트 조회
        const scripts = await prisma.script.findMany({
            where: {
                mentoring: {
                    participants: {
                        some: {
                            userId: req.user.userId,
                        },
                    },
                    ...(type === 'group' ? { isGroup: true } : {}),
                    ...(type === 'one-on-one' ? { isGroup: false } : {}),
                },
            },
            include: {
                user: true,
                mentoring: true,
            },
            orderBy: [{ createdAt: 'desc' }, { scriptId: 'desc' }],
        });

        res.json(
            serialize({
                scripts: scripts.map(mapScript),
            })
        );
    } catch (error) {
        next(error);
    }
});

export default router;