import { prisma } from '../lib/prisma.js';

// 헤더에서 userId를 읽어오는 함수
function readUserIdFromRequest(req) {
    const rawUserId = req.header('x-user-id') ?? req.header('user-id');

    if (!rawUserId) {
        return null;
    }

    try {
        return BigInt(rawUserId);
    } catch {
        return null;
    }
}

// export: 사용자 인증을 요구하는 미들웨어
export async function requireUser(req, res, next) {
    const userId = readUserIdFromRequest(req);

    // userId가 없으면 400 Bad Request 응답
    if (userId === null) {
        return res.status(400).json({ message: 'x-user-id header is required.' });
    }

    // userId로 사용자 조회
    const user = await prisma.user.findUnique({
        where: { userId },
        select: { userId: true, nickname: true, role: true },
    });

    // userId에 해당하는 사용자가 존재하지 않으면 404 Not Found 응답
    if (!user) {
        return res.status(404).json({ message: 'User not found.' });
    }

    // req 객체에 사용자 정보 저장
    req.user = user;
    return next();
}

// export: userId를 반환하는 함수
export function getUserIdFromRequest(req) {
    return readUserIdFromRequest(req);
}