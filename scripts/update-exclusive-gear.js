// Railwayコンソールで実行するスクリプト
// 対象: 盾兵・槍兵・弓兵 各17世代分(計51英雄)の専用装備データ
// 内容: ①Hero.exclusiveGearHpPct/exclusiveGearLethalityPct を装備ステータス%で更新
//       ②専用遠征スキル(集結時/防衛時限定+15%)を skillSlot:4 のHeroSkillとして登録(既存slot4のみ削除して再作成)

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// triggerType: "rallyOnly"(集結) / "defenseOnly"(防衛)
const exclusiveGearData = [
  // ===== 盾兵 =====
  { name: "ナタリア", gearName: "狂風を操る者", pct: 55.0, stat: "殺傷力", trigger: "rallyOnly" },
  { name: "ジェロニモ", gearName: "暁の刃", pct: 62.5, stat: "攻撃力", trigger: "rallyOnly" },
  { name: "フリント", gearName: "グラウルング", pct: 60.0, stat: "攻撃力", trigger: "defenseOnly" },
  { name: "ローガン", gearName: "鋼鉄の拳", pct: 70.0, stat: "防御力", trigger: "defenseOnly" },
  { name: "アクモス", gearName: "守護者の遺物", pct: 92.5, stat: "HP", trigger: "defenseOnly" },
  { name: "ヘクトー", gearName: "鋼牙戦刃", pct: 111.0, stat: "攻撃力", trigger: "defenseOnly" },
  { name: "無名", gearName: "降竜棒", pct: 133.5, stat: "防御力", trigger: "defenseOnly" },
  { name: "エディス", gearName: "仁愛工具箱", pct: 160.5, stat: "HP", trigger: "defenseOnly" },
  { name: "ガト", gearName: "黄金の牙", pct: 193.0, stat: "防御力", trigger: "defenseOnly" },
  { name: "マグヌス", gearName: "嵐の斧", pct: 232.0, stat: "HP", trigger: "defenseOnly" },
  { name: "グレゴリー", gearName: "灼陽巨剣", pct: 277.5, stat: "殺傷力", trigger: "defenseOnly" },
  { name: "エリオノーラ", gearName: "ソラリスの権力", pct: 320.0, stat: "HP", trigger: "defenseOnly" },
  { name: "ヘルヴィル", gearName: "サスラのハンマー", pct: 362.5, stat: "防御力", trigger: "defenseOnly" },
  { name: "ギーゼラ", gearName: "ヘラクレス", pct: 405.0, stat: "攻撃力", trigger: "defenseOnly" },
  { name: "エリーフ", gearName: "残月", pct: 447.5, stat: "防御力", trigger: "defenseOnly" },
  { name: "ハンク", gearName: "轟炎の怒り", pct: 490.0, stat: "HP", trigger: "defenseOnly" },
  { name: "シガー", gearName: "黒光の戦戟", pct: 532.5, stat: "殺傷力", trigger: "defenseOnly" },
  { name: "エイダン", gearName: "灼烈の拳", pct: 575.0, stat: "攻撃力", trigger: "defenseOnly" },

  // ===== 槍兵 =====
  { name: "ジャスミン", gearName: "雪の精霊", pct: 50.0, stat: "殺傷力", trigger: "defenseOnly" },
  { name: "フレンダー", gearName: "神秘の薬典", pct: 60.0, stat: "HP", trigger: "defenseOnly" },
  { name: "ミア", gearName: "運命水晶", pct: 70.0, stat: "攻撃力", trigger: "rallyOnly" },
  { name: "レイナ", gearName: "忍刀・雷切", pct: 92.5, stat: "殺傷力", trigger: "rallyOnly" },
  { name: "ノラ", gearName: "雪原の放浪者", pct: 111.0, stat: "防御力", trigger: "defenseOnly" },
  { name: "レネ", gearName: "マジカルカラーボール", pct: 133.5, stat: "殺傷力", trigger: "rallyOnly" },
  { name: "ゴードン", gearName: "蝕骨の毒", pct: 160.5, stat: "殺傷力", trigger: "rallyOnly" },
  { name: "ソニヤ", gearName: "海蛙", pct: 193.0, stat: "殺傷力", trigger: "defenseOnly" },
  { name: "フレッド", gearName: "浴炎者", pct: 232.0, stat: "攻撃力", trigger: "rallyOnly" },
  { name: "フレイヤ", gearName: "血月の悲哀", pct: 277.5, stat: "防御力", trigger: "defenseOnly" },
  { name: "ロイド", gearName: "巧匠の秘宝", pct: 320.0, stat: "攻撃力", trigger: "defenseOnly" },
  { name: "カロール", gearName: "凛風の槍", pct: 362.5, stat: "攻撃力", trigger: "rallyOnly" },
  { name: "フローラ", gearName: "豊穣の種", pct: 405.0, stat: "HP", trigger: "defenseOnly" },
  { name: "ドミニク", gearName: "イマジナリーボックス", pct: 447.5, stat: "殺傷力", trigger: "rallyOnly" },
  { name: "エステラ", gearName: "ドリームペイント", pct: 490.0, stat: "攻撃力", trigger: "defenseOnly" },
  { name: "ウルタール", gearName: "祖霊の槍", pct: 532.5, stat: "攻撃力", trigger: "rallyOnly" },
  { name: "ベルサ", gearName: "審判のカルテ", pct: 575.0, stat: "殺傷力", trigger: "defenseOnly" },

  // ===== 弓兵 =====
  { name: "ジンマン", gearName: "キツツキ", pct: 50.0, stat: "攻撃力", trigger: "defenseOnly" },
  { name: "アロンゾ", gearName: "エイハブ船長", pct: 60.0, stat: "殺傷力", trigger: "rallyOnly" },
  { name: "グレッグ", gearName: "正義のラッパ", pct: 70.0, stat: "HP", trigger: "rallyOnly" },
  { name: "リオン", gearName: "エラの涙", pct: 92.5, stat: "殺傷力", trigger: "defenseOnly" },
  { name: "グエン", gearName: "希望の翼", pct: 111.0, stat: "殺傷力", trigger: "rallyOnly" },
  { name: "ウェイン", gearName: "パワーブーメラン", pct: 133.5, stat: "殺傷力", trigger: "defenseOnly" },
  { name: "ブラッドリー", gearName: "雷霆重砲", pct: 160.5, stat: "攻撃力", trigger: "defenseOnly" },
  { name: "ヘンドリック", gearName: "深淵ダイバー", pct: 193.0, stat: "攻撃力", trigger: "rallyOnly" },
  { name: "シュラ", gearName: "術士の仮面", pct: 232.0, stat: "攻撃力", trigger: "defenseOnly" },
  { name: "ブランシュ", gearName: "ウルフハンター", pct: 277.5, stat: "殺傷力", trigger: "rallyOnly" },
  { name: "ルーファス", gearName: "燃焼隕石", pct: 320.0, stat: "攻撃力", trigger: "rallyOnly" },
  { name: "ライジーア", gearName: "運命の織り手", pct: 362.5, stat: "攻撃力", trigger: "defenseOnly" },
  { name: "ウルカヌス", gearName: "ヘラクレス", pct: 405.0, stat: "攻撃力", trigger: "rallyOnly" },
  { name: "カーラ", gearName: "ラピッドコメット", pct: 447.5, stat: "殺傷力", trigger: "defenseOnly" },
  { name: "ヴィヴィカ", gearName: "ダークスター", pct: 490.0, stat: "殺傷力", trigger: "rallyOnly" },
  { name: "アシュリン", gearName: "運命の弦", pct: 532.5, stat: "防御力", trigger: "defenseOnly" },
  { name: "エリノ", gearName: "チーフ", pct: 575.0, stat: "殺傷力", trigger: "rallyOnly" },
];

async function main() {
  let updated = 0;
  let notFound = [];
  let failed = [];

  for (const item of exclusiveGearData) {
    try {
      const hero = await prisma.hero.findFirst({ where: { name: item.name } });
      if (!hero) {
        notFound.push(item.name);
        continue;
      }

      // ① Hero本体の専用装備%を更新(殺傷力・HPどちらも同じ%)
      await prisma.hero.update({
        where: { id: hero.id },
        data: {
          exclusiveGearHpPct: item.pct,
          exclusiveGearLethalityPct: item.pct,
        },
      });

      // ② 専用遠征スキル(集結時/防衛時限定+15%)をskillSlot:4として登録
      //    既存のslot4だけ削除してから作り直す(他のスキルは触らない)
      await prisma.heroSkill.deleteMany({ where: { heroId: hero.id, skillSlot: 4 } });
      await prisma.heroSkill.create({
        data: {
          heroId: hero.id,
          name: `専用装備:${item.gearName}`,
          rawText: `${item.trigger === "rallyOnly" ? "集結時のみ" : "防衛時のみ"}発動。${item.stat}+15%`,
          triggerType: item.trigger,
          target: "自分",
          stat: item.stat,
          value: 15,
          skillSlot: 4,
        },
      });

      console.log(`${item.name}: 専用装備(${item.gearName} ${item.pct}%)・専用スキル(${item.trigger}/${item.stat}+15%) 登録完了`);
      updated++;
    } catch (err) {
      console.error(`❌ ${item.name} でエラー:`, err.message);
      failed.push(item.name);
    }
  }

  console.log(`\n=== 完了: ${updated}人更新 ===`);
  if (notFound.length > 0) console.log(`⚠ 見つからなかった英雄: ${notFound.join(', ')}`);
  if (failed.length > 0) console.log(`❌ エラーが出た英雄: ${failed.join(', ')}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
