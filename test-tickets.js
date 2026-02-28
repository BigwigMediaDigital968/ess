const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tickets = await prisma.ticket.findMany({
    where: { type: 'INCIDENT', status: 'OPEN' },
    select: { id: true, ticketNumber: true, title: true, status: true, type: true }
  });
  console.log("OPEN INCIDENTS:");
  console.table(tickets);
  
  const allTickets = await prisma.ticket.findMany({
    select: { id: true, ticketNumber: true, title: true, status: true, type: true }
  });
  console.log("\nALL TICKETS:");
  console.table(allTickets);
}

main().catch(console.error).finally(() => prisma.$disconnect());
