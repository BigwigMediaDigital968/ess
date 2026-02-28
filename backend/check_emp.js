const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const employees = await prisma.user.findMany({
    include: { certifications: true }
  });
  const raj = employees.find(e => e.email === 'raj.mohan@bigwig.local');
  console.log("Raj from findMany:", raj ? raj.certifications : "Not found");
}
main().catch(console.error).finally(() => prisma.$disconnect());
