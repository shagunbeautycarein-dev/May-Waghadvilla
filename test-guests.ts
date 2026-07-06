import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const guests = await prisma.guest.findMany();
  console.log(guests);
}

main().catch(console.error).finally(() => prisma.$disconnect());
