import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const heroes = await prisma.hero.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(heroes);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!body.troopType) {
    return NextResponse.json({ error: "troopType is required" }, { status: 400 });
  }

  const toInt = (v: unknown) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  const hero = await prisma.hero.create({
    data: {
      name: body.name,
      troopType: body.troopType,
      atk: toInt(body.atk),
      def: toInt(body.def),
      hp: toInt(body.hp),
      lethality: toInt(body.lethality),
      skillEffectTarget1: body.skillEffectTarget1 || null,
      skillEffectStat1: body.skillEffectStat1 || null,
      skillEffectValue1: toInt(body.skillEffectValue1),
      skillEffectTarget2: body.skillEffectTarget2 || null,
      skillEffectStat2: body.skillEffectStat2 || null,
      skillEffectValue2: toInt(body.skillEffectValue2),
      skills: body.skills || null,
      notes: body.notes || null,
    },
  });
  return NextResponse.json(hero);
}
