import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const svsRoundId = Number(params.id);
  const body = await req.json();

  if (!body.playerName) {
    return NextResponse.json({ error: "playerName is required" }, { status: 400 });
  }

  const toInt = (v: unknown) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  const timeSlotIds: number[] = Array.isArray(body.timeSlotIds)
    ? body.timeSlotIds.map((v: unknown) => Number(v)).filter((n: number) => !Number.isNaN(n))
    : [];

  const participant = await prisma.svsParticipant.create({
    data: {
      svsRoundId,
      playerName: body.playerName,
      hasT12: !!body.hasT12,
      t12ShieldSkill: toInt(body.t12ShieldSkill),
      t12SpearSkill: toInt(body.t12SpearSkill),
      t12BowSkill: toInt(body.t12BowSkill),
      noSleepRisk: !!body.noSleepRisk,
      timeSlots: {
        create: timeSlotIds.map((timeSlotId) => ({ timeSlotId })),
      },
    },
  });

  return NextResponse.json(participant);
}

