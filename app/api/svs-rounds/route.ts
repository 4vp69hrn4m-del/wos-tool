import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rounds = await prisma.svsRound.findMany({
    orderBy: { createdAt: "desc" },
    include: { timeSlots: true },
  });
  return NextResponse.json(rounds);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.roundName) {
    return NextResponse.json({ error: "roundName is required" }, { status: 400 });
  }

  const round = await prisma.svsRound.create({
    data: {
      roundName: body.roundName,
      eventDate: body.eventDate ? new Date(body.eventDate) : null,
      opponent: body.opponent || null,
      status: body.status || null,
    },
  });

  return NextResponse.json(round);
}
