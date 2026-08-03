import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  const body = await req.json();

  const toInt = (v: unknown) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  const hero = await prisma.hero.update({
    where: { id },
    data: {
      name: body.name,
      troopType: body.troopType,
      generation: toInt(body.generation),
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
      skillEffectTarget3: body.skillEffectTarget3 || null,
      skillEffectStat3: body.skillEffectStat3 || null,
      skillEffectValue3: toInt(body.skillEffectValue3),
      skills: body.skills || null,
    },
  });
  return NextResponse.json(hero);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  await prisma.hero.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
