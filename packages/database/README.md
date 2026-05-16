# @carpoolink/database

Carpoolink 서비스의 PostgreSQL 데이터베이스 스키마와 Prisma ORM 클라이언트입니다.

## 설정

```bash
npm install -w packages/database
```

## 스키마 변경 및 마이그레이션

### 스키마 수정

`packages/database/prisma/schema.prisma`를 수정한 후:

```bash
npx prisma db push
```

> ⚠️ `prisma migrate dev`를 사용하지 않습니다. Carpoolink는 `db push` 워크플로우를 사용합니다.

### Prisma 클라이언트 재생성

스키마 변경 후 Prisma 클라이언트는 자동으로 재생성되지만, 필요시 수동으로 재생성할 수 있습니다:

```bash
npx prisma generate --schema packages/database/prisma/schema.prisma
```

## 데이터 모델

### 주요 엔티티

- **User**: 사용자(멘토/멘티)
- **Mentoring**: 멘토링 세션(일대일/일대다)
- **Question**: 멘토링 중 제출되는 질문(유료/무료)
- **MentoringChat**: 멘토링 채팅 메시지

## 유료 질문 기능 (Paid Questions)

### Question 모델 확장

유료 질문 기능을 위해 Question 모델에 다음 필드가 추가되었습니다:

- `answerContent`: 멘토의 답변 내용 (Text, nullable)
- `answeredAt`: 답변 완료 시간 (DateTime, nullable)
- `answeredByUserId`: 답변한 멘토의 ID (BigInt, nullable)
- `answerer`: 답변한 멘토의 User 객체 (관계)

### 트랜잭션 기반 잔액 차감

질문 등록 시 유료 질문(`isPaid: true`)인 경우:

1. 멘티의 `QuestionCredit` 잔액이 1회 차감됩니다.
2. 새로운 질문이 생성됩니다.
3. 위 두 작업은 **원자적 트랜잭션**으로 처리되어 동시성 문제를 방지합니다.

```javascript
// 예시: core-api/src/routes/mentorings.js
await prisma.$transaction(async (tx) => {
    // 잔액 차감
    const updatedCredit = await tx.questionCredit.update({
        where: { creditId: credit.creditId },
        data: { balance: credit.balance - 1 },
    });

    // 질문 생성
    const question = await tx.question.create({
        data: { /* ... */ }
    });

    return { credit: updatedCredit, question };
});
```

## 사용 예시

```javascript
import { PrismaClient } from '@carpoolink/database';

const prisma = new PrismaClient();

// 질문 조회 (답변 정보 포함)
const question = await prisma.question.findUnique({
    where: { questionId: '123' },
    include: {
        user: { select: { userId: true, nickname: true } },
        answerer: { select: { userId: true, nickname: true } },
    },
});

// 질문 상태 업데이트
const updated = await prisma.question.update({
    where: { questionId: '123' },
    data: {
        status: 'COMPLETED',
        answeredAt: new Date(),
        answeredByUserId: mentorUserId,
    },
});
```
