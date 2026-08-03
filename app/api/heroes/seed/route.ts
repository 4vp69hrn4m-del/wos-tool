import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 盾兵(歩兵) SSR 世代1〜16
const shieldHeroes: [string, number][] = [
  ["ジェロニモ", 1],
  ["ナタリア", 1],
  ["フリント", 2],
  ["ローガン", 3],
  ["アクモス", 4],
  ["ヘクトー", 5],
  ["無名", 6],
  ["エディス", 7],
  ["ガト", 8],
  ["マグヌス", 9],
  ["グレゴリー", 10],
  ["エリオノーラ", 11],
  ["ヘルヴィル", 12],
  ["ギーゼラ", 13],
  ["エリーフ", 14],
  ["ハンク", 15],
  ["シガー", 16],
];

// 槍兵(騎兵) SSR 世代1〜16
const spearHeroes: [string, number][] = [
  ["ジャスミン", 1],
  ["フレンダ―", 2],
  ["ミア", 3],
  ["レイナ", 4],
  ["ノラ", 5],
  ["レネ", 6],
  ["ゴードン", 7],
  ["ソニヤ", 8],
  ["フレッド", 9],
  ["フレイヤ", 10],
  ["ロイド", 11],
  ["カロール", 12],
  ["フローラ", 13],
  ["ドミニク", 14],
  ["エステラ", 15],
  ["ウルタール", 16],
];

// 弓兵 SSR 世代1〜16
const bowHeroes: [string, number][] = [
  ["ジンマン", 1],
  ["アロンゾ", 2],
  ["グレッグ", 3],
  ["リオン", 4],
  ["グエン", 5],
  ["ウェイン", 6],
  ["ブラッドリー", 7],
  ["ヘンドリック", 8],
  ["シュラ", 9],
  ["ブランシュ", 10],
  ["ルーファス", 11],
  ["ライジーア", 12],
  ["ウルカヌス", 13],
  ["カーラ", 14],
  ["ヴィヴィカ", 15],
  ["アシュリン", 16],
];

export async function POST() {
  const data = [
    ...shieldHeroes.map(([name, generation]) => ({
      name,
      troopType: "歩兵",
      generation,
    })),
    ...spearHeroes.map(([name, generation]) => ({
      name,
      troopType: "騎兵",
      generation,
    })),
    ...bowHeroes.map(([name, generation]) => ({
      name,
      troopType: "弓兵",
      generation,
    })),
  ];

  const result = await prisma.hero.createMany({
    data,
    skipDuplicates: true,
  });

  return NextResponse.json({ created: result.count });
}
