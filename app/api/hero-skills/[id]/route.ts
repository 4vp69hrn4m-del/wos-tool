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

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.skillSlot !== undefined) data.skillSlot = toInt(body.skillSlot) || 1;
  if (body.triggerType !== undefined) data.triggerType = body.triggerType;
  if (body.triggerValue !== undefined) data.triggerValue = toInt(body.triggerValue);
  if (body.requiredTroopType !== undefined) data.requiredTroopType = body.requiredTroopType || null;
  if (body.target !== undefined) data.target = body.target;
  if (body.stat !== undefined) data.stat = body.stat;
  if (body.value !== undefined) data.value = toInt(body.value) || 0;
  if (body.durationTurns !== undefined) data.durationTurns = toInt(body.durationTurns);
  if (body.targetTroopType !== undefined) data.targetTroopType = body.targetTroopType || null;

  const skill = await prisma.heroSkill.update({
    where: { id },
    data,
  });

  return NextResponse.json(skill);
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
  await prisma.heroSkill.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
