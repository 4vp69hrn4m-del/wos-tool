const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const heroes = await prisma.hero.findMany({ where: { name: { contains: 'フレン' } } });
  for (const h of heroes) {
    console.log(`名前: "${h.name}" / 長さ: ${h.name.length} / 文字コード: ${[...h.name].map(c => c.charCodeAt(0)).join(',')}`);
  }
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
