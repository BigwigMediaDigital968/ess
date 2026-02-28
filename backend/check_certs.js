const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'raj.mohan@bigwig.local' }, include: { certifications: true } });
  console.log("Certs for raj.mohan:", user ? user.certifications : "User not found");
}
main().catch(console.error).finally(() => prisma.$disconnect());
