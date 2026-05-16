const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const tables = await prisma.$queryRawUnsafe(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    tables.forEach(t => console.log(t.table_name));
  } catch (e) {
    console.error(e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
