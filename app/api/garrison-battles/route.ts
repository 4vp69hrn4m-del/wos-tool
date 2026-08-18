import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const battles = await prisma.garrisonBattle.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      participants: {
        include: { shieldHero: true, spearHero: true, bowHero: true },
        orderBy: { troopCount: "desc" },
      },
    },
  });
  return NextResponse.json(battles);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const toInt = (v: unknown) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : Math.round(n);
  };
  const toFloat = (v: unknown) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  const battle = await prisma.garrisonBattle.create({
    data: {
      label: body.label || null,
      battleDate: body.battleDate ? new Date(body.battleDate) : null,
      side: body.side || "defense",
      result: body.result || null,
      myName: body.myName || null,
      myAlliance: body.myAlliance || null,
      enemyName: body.enemyName || null,
      enemyAlliance: body.enemyAlliance || null,

      myShieldCount: toInt(body.myShieldCount),
      mySpearCount: toInt(body.mySpearCount),
      myBowCount: toInt(body.myBowCount),
      enemyShieldCount: toInt(body.enemyShieldCount),
      enemySpearCount: toInt(body.enemySpearCount),
      enemyBowCount: toInt(body.enemyBowCount),

      myBuffShieldAtkPct: toFloat(body.myBuffShieldAtkPct),
      myBuffShieldDefPct: toFloat(body.myBuffShieldDefPct),
      myBuffShieldLethalityPct: toFloat(body.myBuffShieldLethalityPct),
      myBuffShieldHpPct: toFloat(body.myBuffShieldHpPct),
      myBuffSpearAtkPct: toFloat(body.myBuffSpearAtkPct),
      myBuffSpearDefPct: toFloat(body.myBuffSpearDefPct),
      myBuffSpearLethalityPct: toFloat(body.myBuffSpearLethalityPct),
      myBuffSpearHpPct: toFloat(body.myBuffSpearHpPct),
      myBuffBowAtkPct: toFloat(body.myBuffBowAtkPct),
      myBuffBowDefPct: toFloat(body.myBuffBowDefPct),
      myBuffBowLethalityPct: toFloat(body.myBuffBowLethalityPct),
      myBuffBowHpPct: toFloat(body.myBuffBowHpPct),

      enemyBuffShieldAtkPct: toFloat(body.enemyBuffShieldAtkPct),
      enemyBuffShieldDefPct: toFloat(body.enemyBuffShieldDefPct),
      enemyBuffShieldLethalityPct: toFloat(body.enemyBuffShieldLethalityPct),
      enemyBuffShieldHpPct: toFloat(body.enemyBuffShieldHpPct),
      enemyBuffSpearAtkPct: toFloat(body.enemyBuffSpearAtkPct),
      enemyBuffSpearDefPct: toFloat(body.enemyBuffSpearDefPct),
      enemyBuffSpearLethalityPct: toFloat(body.enemyBuffSpearLethalityPct),
      enemyBuffSpearHpPct: toFloat(body.enemyBuffSpearHpPct),
      enemyBuffBowAtkPct: toFloat(body.enemyBuffBowAtkPct),
      enemyBuffBowDefPct: toFloat(body.enemyBuffBowDefPct),
      enemyBuffBowLethalityPct: toFloat(body.enemyBuffBowLethalityPct),
      enemyBuffBowHpPct: toFloat(body.enemyBuffBowHpPct),

      myLoss: toInt(body.myLoss),
      myInjured: toInt(body.myInjured),
      myLightInjured: toInt(body.myLightInjured),
      mySurvivors: toInt(body.mySurvivors),
      enemyLoss: toInt(body.enemyLoss),
      enemyInjured: toInt(body.enemyInjured),
      enemyLightInjured: toInt(body.enemyLightInjured),
      enemySurvivors: toInt(body.enemySurvivors),

      notes: body.notes || null,
    },
  });

  return NextResponse.json(battle);
}
