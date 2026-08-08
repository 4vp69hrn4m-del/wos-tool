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

  if (!body.name || !body.triggerType || !body.target || !body.stat) {
    return NextResponse.json(
      { error: "name, triggerType, target, stat is required" },
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
      triggerType: body.triggerType,
      triggerValue: toInt(body.triggerValue),
      target: body.target,
      stat: body.stat,
      value: toInt(body.value) || 0,
      durationTurns: toInt(body.durationTurns),
    },
  });

  return NextResponse.json(skill);
}
