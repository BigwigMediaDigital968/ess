const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const depts = ['Engineering', 'Human Resources', 'Sales', 'Marketing', 'Finance', 'Operations', 'Design'];

    for (const name of depts) {
        const exists = await prisma.department.findUnique({ where: { name } });
        if (!exists) {
            await prisma.department.create({
                data: { name }
            });
            console.log(`Created department: ${name}`);
        } else {
            console.log(`Department matches: ${name}`);
        }
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
