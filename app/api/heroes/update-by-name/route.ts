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
    "atk",
    "def",
    "hp",
    "lethality",
    "generation",
    "exclusiveGearHpPct",
    "exclusiveGearLethalityPct",
  ];
  const floatFields = ["expeditionAtkPct", "expeditionDefPct"];

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

  // skills配列が渡された場合、同じ名前の既存スキルだけ削除してから登録し直す
  // (このAPIが送ってきた分だけを上書きし、他の手段で登録された別のスキル名は残す)
  if (Array.isArray(body.skills)) {
    const toIntOrNull = (v: unknown) => {
      if (v === "" || v === null || v === undefined) return null;
      const n = Number(v);
      return Number.isNaN(n) ? null : n;
    };
    for (const s of body.skills) {
      if (!s.name || !s.triggerType) continue;
      await prisma.heroSkill.deleteMany({
        where: { heroId: existing.id, name: s.name },
      });
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
