import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

// body.data: [{ name, gearPct, skillStat, skillValue, triggerType }, ...]
export async function POST(req: NextRequest) {
  const authError = checkAdminAuth(req);
  if (authError) return authError;

  const body = await req.json();
  if (!Array.isArray(body.data)) {
    return NextResponse.json({ error: "data array is required" }, { status: 400 });
  }

  let updated = 0;
  let skillsAdded = 0;
  const notFound: string[] = [];

  for (const row of body.data) {
    const hero = await prisma.hero.findUnique({ where: { name: row.name } });
    if (!hero) {
      notFound.push(row.name);
      continue;
    }

    await prisma.hero.update({
      where: { id: hero.id },
      data: {
        exclusiveGearHpPct: row.gearPct,
        exclusiveGearLethalityPct: row.gearPct,
      },
    });
    updated++;

    // 同名の専用装備スキルが既にあれば重複させないよう先に消す
    await prisma.heroSkill.deleteMany({
      where: { heroId: hero.id, name: "専用装備スキル" },
    });
    await prisma.heroSkill.create({
      data: {
        heroId: hero.id,
        name: "専用装備スキル",
        skillSlot: 1,
        triggerType: row.triggerType,
        triggerValue: null,
        target: "self",
        stat: row.skillStat,
        value: row.skillValue,
        durationTurns: null,
      },
    });
    skillsAdded++;
  }

  return NextResponse.json({ updated, skillsAdded, notFound });
}
