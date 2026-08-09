const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const hero = await prisma.hero.findFirst({ where: { name: 'フレンダー-' } });
  if (!hero) {
    console.log('見つかりません');
    await prisma.$disconnect();
    return;
  }

  await prisma.hero.update({
    where: { id: hero.id },
    data: { exclusiveGearHpPct: 60.0, exclusiveGearLethalityPct: 60.0 },
  });

  await prisma.heroSkill.deleteMany({ where: { heroId: hero.id, skillSlot: 4 } });
  await prisma.heroSkill.create({
    data: {
      heroId: hero.id,
      name: '専用装備:神秘の薬典',
      rawText: '防衛時のみ発動。HP+15%',
      triggerType: 'defenseOnly',
      target: '自分',
      stat: 'HP',
      value: 15,
      skillSlot: 4,
    },
  });

  console.log('フレンダー: 専用装備(神秘の薬典 60.0%)・専用スキル(defenseOnly/HP+15%) 登録完了');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
