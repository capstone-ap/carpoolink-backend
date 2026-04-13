const VALID_STATUSES = new Set(['READY', 'ON_AIR', 'COMPLETED']);

// mentoring 레코드를 일관된 형태로 변환하는 헬퍼 함수
function normalizeMentoring(record) {
    if (!record) {
        return null;
    }

    return {
        mentoringId: Number(record.mentoringId),
        title: record.title,
        isGroup: Boolean(record.isGroup),
        status: record.status,
        startedAt: record.startedAt ? new Date(record.startedAt).toISOString() : null,
        endedAt: record.endedAt ? new Date(record.endedAt).toISOString() : null,
        userId: Number(record.userId)
    };
}

// 간단한 인메모리 구현과 Prisma 기반 구현을 모두 지원하는 멘토링 리포지토리
class InMemoryMentoringRepository {
    constructor() {
        this.nextId = 1;
        this.sessions = new Map();
    }

    // 새로운 멘토링 세션을 생성하는 메서드
    async createMentoring({ title, userId, isGroup, status }) {
        const mentoringId = this.nextId;
        this.nextId += 1;

        const session = {
            mentoringId,
            title,
            isGroup,
            status,
            startedAt: status === 'ON_AIR' ? new Date() : null,
            endedAt: null,
            userId: Number(userId)
        };

        this.sessions.set(mentoringId, session);
        return normalizeMentoring(session);
    }

    // mentoringId로 멘토링 세션을 조회하는 메서드
    async getMentoringById(mentoringId) {
        return normalizeMentoring(this.sessions.get(Number(mentoringId)) ?? null);
    }

    // 멘토링 세션을 종료하는 메서드
    async endMentoring(mentoringId) {
        const key = Number(mentoringId);
        const current = this.sessions.get(key);

        if (!current) {
            throw new Error(`Mentoring ${key} not found`);
        }

        const updated = {
            ...current,
            status: 'COMPLETED',
            endedAt: new Date()
        };

        this.sessions.set(key, updated);
        return normalizeMentoring(updated);
    }
}

// Prisma가 사용 가능한 경우 실제 데이터베이스와 상호작용하는 리포지토리 구현
class PrismaMentoringRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }

    // 새로운 멘토링 세션을 데이터베이스에 생성하는 메서드
    async createMentoring({ title, userId, isGroup, status }) {
        if (!VALID_STATUSES.has(status)) {
            throw new Error(`Invalid mentoring status: ${status}`);
        }

        const created = await this.prisma.mentoring.create({
            data: {
                title,
                isGroup,
                status,
                startedAt: status === 'ON_AIR' ? new Date() : null,
                userId: BigInt(userId)
            }
        });

        return normalizeMentoring(created);
    }

    // mentoringId로 멘토링 세션을 데이터베이스에서 조회하는 메서드
    async getMentoringById(mentoringId) {
        const found = await this.prisma.mentoring.findUnique({
            where: {
                mentoringId: BigInt(mentoringId)
            }
        });

        return normalizeMentoring(found);
    }

    // 멘토링 세션을 데이터베이스에서 종료하는 메서드
    async endMentoring(mentoringId) {
        const updated = await this.prisma.mentoring.update({
            where: {
                mentoringId: BigInt(mentoringId)
            },
            data: {
                status: 'COMPLETED',
                endedAt: new Date()
            }
        });

        return normalizeMentoring(updated);
    }
}

// 멘토링 리포지토리를 생성하는 팩토리 함수
export async function createMentoringRepository() {
    try {
        const { prisma } = await import('@carpoolink/database');
        return new PrismaMentoringRepository(prisma);
    } catch (error) {
        console.warn('[media-server] Prisma unavailable, using in-memory mentoring repository');
        return new InMemoryMentoringRepository();
    }
}
