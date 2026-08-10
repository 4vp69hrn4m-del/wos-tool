import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = checkAdminAuth(req);
  if (authError) return authError;

  const heroId = Number(params.id);
  const body = await req.json();

  if (!body.name || !body.triggerType) {
    return NextResponse.json(
      { error: "name, triggerType is required" },
      { status: 400 }
    );
  }

  const toInt = (v: unknown) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  const skill = await prisma.heroSkill.create({
    data: {
      heroId,
      name: body.name,
      skillSlot: toInt(body.skillSlot) || 1,
      triggerType: body.triggerType,
      triggerValue: toInt(body.triggerValue),
      requiredTroopType: body.requiredTroopType || null,
      target: body.target || null,
      stat: body.stat || null,
      value: toInt(body.value),
      durationTurns: toInt(body.durationTurns),
      targetTroopType: body.targetTroopType || null,
      rawText: body.rawText || null,
      killPerActivation: toInt(body.killPerActivation),
    },
  });

  return NextResponse.json(skill);
}
