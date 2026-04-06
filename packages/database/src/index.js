import { PrismaClient } from '@prisma/client';

// 싱글톤 패턴으로 클라이언트 내보내기
export const prisma = new PrismaClient();
export * from '@prisma/client';