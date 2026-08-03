import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const existing = await prisma.hero.findUnique({ where: { name: body.name } });
  if (!existing) {
    return NextResponse.json(
      { error: `hero not found: ${body.name}` },
      { status: 404 }
    );
  }

  const toInt = (v: unknown) => {
    if (v === "" || v === null || v === undefined) return undefined;
    const n = Number(v);
    return Number.isNaN(n) ? undefined : n;
  };

  const data: Record<string, unknown> = {};
  const intFields = [
    "atk",
    "def",
    "hp",
    "lethality",
    "generation",
    "skillEffectValue1",
    "skillEffectValue2",
    "skillEffectValue3",
  ];
  const strFields = [
    "skillEffectTarget1",
    "skillEffectStat1",
    "skillEffectTarget2",
    "skillEffectStat2",
    "skillEffectTarget3",
    "skillEffectStat3",
    "skills",
  ];

  for (const f of intFields) {
    if (body[f] !== undefined) {
      const v = toInt(body[f]);
      if (v !== undefined) data[f] = v;
    }
  }
  for (const f of strFields) {
    if (body[f] !== undefined) data[f] = body[f];
  }

  const hero = await prisma.hero.update({
    where: { name: body.name },
    data,
  });

  return NextResponse.json(hero);
}
