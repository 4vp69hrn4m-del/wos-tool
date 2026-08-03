import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const formations = await prisma.formation.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(formations);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const toInt = (v: unknown) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  const formation = await prisma.formation.create({
    data: {
      label: body.label || null,
      side: body.side || "self",
      formationType: body.formationType || null,
      shieldHeroName: body.shieldHeroName || null,
      spearHeroName: body.spearHeroName || null,
      bowHeroName: body.bowHeroName || null,
      expertName: body.expertName || null,
      petName: body.petName || null,
      infantryPct: toInt(body.infantryPct),
      cavalryPct: toInt(body.cavalryPct),
      archerPct: toInt(body.archerPct),
      troopCount: toInt(body.troopCount),
      equipShieldAtkPct: toInt(body.equipShieldAtkPct),
      equipShieldDefPct: toInt(body.equipShieldDefPct),
      equipShieldLethalityPct: toInt(body.equipShieldLethalityPct),
      equipShieldHpPct: toInt(body.equipShieldHpPct),
      equipSpearAtkPct: toInt(body.equipSpearAtkPct),
      equipSpearDefPct: toInt(body.equipSpearDefPct),
      equipSpearLethalityPct: toInt(body.equipSpearLethalityPct),
      equipSpearHpPct: toInt(body.equipSpearHpPct),
      equipBowAtkPct: toInt(body.equipBowAtkPct),
      equipBowDefPct: toInt(body.equipBowDefPct),
      equipBowLethalityPct: toInt(body.equipBowLethalityPct),
      equipBowHpPct: toInt(body.equipBowHpPct),
      gemShieldAtkPct: toInt(body.gemShieldAtkPct),
      gemShieldDefPct: toInt(body.gemShieldDefPct),
      gemShieldLethalityPct: toInt(body.gemShieldLethalityPct),
      gemShieldHpPct: toInt(body.gemShieldHpPct),
      gemSpearAtkPct: toInt(body.gemSpearAtkPct),
      gemSpearDefPct: toInt(body.gemSpearDefPct),
      gemSpearLethalityPct: toInt(body.gemSpearLethalityPct),
      gemSpearHpPct: toInt(body.gemSpearHpPct),
      gemBowAtkPct: toInt(body.gemBowAtkPct),
      gemBowDefPct: toInt(body.gemBowDefPct),
      gemBowLethalityPct: toInt(body.gemBowLethalityPct),
      gemBowHpPct: toInt(body.gemBowHpPct),
      equipmentNote: body.equipmentNote || null,
    },
  });

  return NextResponse.json(formation);
}
