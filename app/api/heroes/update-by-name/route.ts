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
    "exclusiveGearAtkPct",
    "exclusiveGearDefPct",
    "exclusiveGearHpPct",
    "exclusiveGearLethalityPct",
  ];

  for (const f of intFields) {
    if (body[f] !== undefined) {
      const v = toInt(body[f]);
      if (v !== undefined) data[f] = v;
    }
  }

  const hero = await prisma.hero.update({
    where: { name: body.name },
    data,
  });

  // skills配列が渡された場合、その英雄のスキルとしてまとめて追加する
  if (Array.isArray(body.skills)) {
    const toIntOrNull = (v: unknown) => {
      if (v === "" || v === null || v === undefined) return null;
      const n = Number(v);
      return Number.isNaN(n) ? null : n;
    };
    for (const s of body.skills) {
      if (!s.name || !s.triggerType || !s.target || !s.stat) continue;
      await prisma.heroSkill.create({
        data: {
          heroId: existing.id,
          name: s.name,
          skillSlot: toIntOrNull(s.skillSlot) || 1,
          triggerType: s.triggerType,
          triggerValue: toIntOrNull(s.triggerValue),
          requiredTroopType: s.requiredTroopType || null,
          target: s.target,
          stat: s.stat,
          value: toIntOrNull(s.value) || 0,
          durationTurns: toIntOrNull(s.durationTurns),
          targetTroopType: s.targetTroopType || null,
        },
      });
    }
  }

  return NextResponse.json(hero);
}
