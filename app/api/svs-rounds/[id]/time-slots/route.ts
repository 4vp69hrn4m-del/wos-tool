import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const svsRoundId = Number(params.id);
  const body = await req.json();

  if (!body.label) {
    return NextResponse.json({ error: "label is required" }, { status: 400 });
  }

  const timeSlot = await prisma.svsTimeSlot.create({
    data: {
      svsRoundId,
      label: body.label,
    },
  });

  return NextResponse.json(timeSlot);
}
