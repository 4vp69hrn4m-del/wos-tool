import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const heroes = await prisma.hero.findMany({
    orderBy: [{ troopType: "asc" }, { generation: "asc" }, { name: "asc" }],
    include: { skills: true },
  });
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
      generation: toInt(body.generation),
      atk: toInt(body.atk),
      def: toInt(body.def),
      hp: toInt(body.hp),
      lethality: toInt(body.lethality),
      exclusiveGearAtkPct: toInt(body.exclusiveGearAtkPct),
      exclusiveGearDefPct: toInt(body.exclusiveGearDefPct),
      exclusiveGearHpPct: toInt(body.exclusiveGearHpPct),
      exclusiveGearLethalityPct: toInt(body.exclusiveGearLethalityPct),
      notes: body.notes || null,
    },
  });
  return NextResponse.json(hero);
}
