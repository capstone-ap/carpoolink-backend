import { PrismaClient, FieldName } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const fields = Object.values(FieldName);

    for (const name of fields) {
        await prisma.field.upsert({
            where: { fieldName: name },
            update: {},
            create: { fieldName: name },
        });
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });