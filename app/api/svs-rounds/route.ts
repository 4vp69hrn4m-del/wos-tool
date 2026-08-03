import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rounds = await prisma.svsRound.findMany({
    orderBy: { createdAt: "desc" },
    include: { timeSlots: true },
  });
  return NextResponse.json(rounds);
}

const PRESET_TIME_SLOTS = ["21:00〜23:00", "23:00〜01:00", "01:00〜02:00"];

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
      timeSlots: {
        create: PRESET_TIME_SLOTS.map((label) => ({ label })),
      },
    },
  });

  return NextResponse.json(round);
}
