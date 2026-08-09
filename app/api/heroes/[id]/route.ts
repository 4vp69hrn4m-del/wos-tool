import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = checkAdminAuth(req);
  if (authError) return authError;

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
      exclusiveGearHpPct: toInt(body.exclusiveGearHpPct),
      exclusiveGearLethalityPct: toInt(body.exclusiveGearLethalityPct),
      notes: body.notes || null,
    },
  });
  return NextResponse.json(hero);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = checkAdminAuth(req);
  if (authError) return authError;

  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  await prisma.hero.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
