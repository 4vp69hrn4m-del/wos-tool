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

  const toFloat = (v: unknown) => {
    if (v === "" || v === null || v === undefined) return undefined;
    const n = Number(v);
    return Number.isNaN(n) ? undefined : n;
  };

  const data: Record<string, unknown> = {};
  const intFields = [
    "hp",
    "lethality",
    "generation",
  ];
  const floatFields = [
    "atk",
    "def",
    "expeditionAtkPct",
    "expeditionDefPct",
    "exclusiveGearHpPct",
    "exclusiveGearLethalityPct",
  ];

  for (const f of intFields) {
    if (body[f] !== undefined) {
      const v = toInt(body[f]);
      if (v !== undefined) data[f] = v;
    }
  }
  for (const f of floatFields) {
    if (body[f] !== undefined) {
      const v = toFloat(body[f]);
      if (v !== undefined) data[f] = v;
    }
  }

  const hero = await prisma.hero.update({
    where: { name: body.name },
    data,
  });

  // skills配列が渡された場合、まずこのリクエストに含まれるスキル名をまとめて1回だけ削除し、
  // そのあとまとめて作り直す(同じ名前が複数件届くケースで、後の1件が前の1件を
  // 消してしまわないようにするため)
  if (Array.isArray(body.skills)) {
    const toIntOrNull = (v: unknown) => {
      if (v === "" || v === null || v === undefined) return null;
      const n = Number(v);
      return Number.isNaN(n) ? null : n;
    };

    const validSkills = body.skills.filter((s: Record<string, unknown>) => s.name && s.triggerType);
    const names = Array.from(new Set(validSkills.map((s: Record<string, unknown>) => s.name as string)));

    if (names.length > 0) {
      await prisma.heroSkill.deleteMany({
        where: { heroId: existing.id, name: { in: names } },
      });
    }

    for (const s of validSkills) {
      await prisma.heroSkill.create({
        data: {
          heroId: existing.id,
          name: s.name,
          skillSlot: toIntOrNull(s.skillSlot) || 1,
          triggerType: s.triggerType,
          triggerValue: toIntOrNull(s.triggerValue),
          requiredTroopType: s.requiredTroopType || null,
          target: s.target || null,
          stat: s.stat || null,
          value: toIntOrNull(s.value),
          durationTurns: toIntOrNull(s.durationTurns),
          targetTroopType: s.targetTroopType || null,
          rawText: s.rawText || null,
        },
      });
    }
  }

  return NextResponse.json(hero);
}
