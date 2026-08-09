const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const hero = await prisma.hero.findFirst({ where: { name: 'フレンダ―' } });
  if (!hero) {
    console.log('見つかりません');
    await prisma.$disconnect();
    return;
  }

  // 遠征スキル(skillSlot 1〜3)だけ削除してから登録(skillSlot4の専用装備スキルは触らない)
  const deleted = await prisma.heroSkill.deleteMany({
    where: { heroId: hero.id, skillSlot: { in: [1, 2, 3] } },
  });
  console.log(`既存の遠征スキル ${deleted.count}件 削除`);

  const skills = [
    { name: "強健の秘訣", rawText: "味方全部隊の攻撃力が15%、防御力が10%上昇する。", triggerType: "常時", target: "自分", stat: "攻撃力", value: 15, skillSlot: 1 },
    { name: "強化薬剤", rawText: "味方全部隊が攻撃する際、25%の確率で200%のダメージを与える。", triggerType: "確率25%", target: "敵", stat: "ダメージ", value: 200, skillSlot: 2 },
    { name: "眩暈胞子", rawText: "味方全部隊が攻撃する際、20%の確率で敵を眩暈状態にする。1ターン持続。", triggerType: "確率20%", target: "敵", stat: null, value: null, skillSlot: 3 },
  ];

  for (const skill of skills) {
    await prisma.heroSkill.create({
      data: {
        heroId: hero.id,
        name: skill.name,
        rawText: skill.rawText,
        triggerType: skill.triggerType,
        target: skill.target,
        stat: skill.stat,
        value: skill.value,
        skillSlot: skill.skillSlot,
      },
    });
  }

  console.log('フレンダー: 遠征スキル3件 登録完了');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
