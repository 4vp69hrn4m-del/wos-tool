import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  const authError = checkAdminAuth(req);
  if (authError) return authError;

  const body = await req.json();
  if (!body.svsRoundId || !body.playerName) {
    return NextResponse.json(
      { error: "svsRoundId と playerName は必須です" },
      { status: 400 }
    );
  }

  const ranking = await prisma.svsRanking.create({
    data: {
      svsRoundId: Number(body.svsRoundId),
      playerName: body.playerName,
      rank: body.rank !== undefined && body.rank !== "" ? Number(body.rank) : null,
    },
  });

  return NextResponse.json(ranking);
}
