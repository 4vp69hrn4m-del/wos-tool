import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const toInt = (v: unknown) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : Math.round(n);
  };
  const toIdOrNull = (v: unknown) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  if (!body.garrisonBattleId || !body.playerName) {
    return NextResponse.json(
      { error: "garrisonBattleId と playerName は必須です" },
      { status: 400 }
    );
  }

  const participant = await prisma.garrisonParticipant.create({
    data: {
      garrisonBattleId: Number(body.garrisonBattleId),
      side: body.side || "mine",
      playerName: body.playerName,
      troopCount: toInt(body.troopCount),
      kills: toInt(body.kills),
      isLeader: !!body.isLeader,
      shieldHeroId: toIdOrNull(body.shieldHeroId),
      spearHeroId: toIdOrNull(body.spearHeroId),
      bowHeroId: toIdOrNull(body.bowHeroId),
    },
  });

  return NextResponse.json(participant);
}
