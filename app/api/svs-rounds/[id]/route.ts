import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  const round = await prisma.svsRound.findUnique({
    where: { id },
    include: { timeSlots: true },
  });
  if (!round) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(round);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  const body = await req.json();

  const round = await prisma.svsRound.update({
    where: { id },
    data: {
      roundName: body.roundName,
      eventDate: body.eventDate ? new Date(body.eventDate) : null,
      opponent: body.opponent || null,
      status: body.status || null,
    },
  });

  return NextResponse.json(round);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  await prisma.svsRound.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
