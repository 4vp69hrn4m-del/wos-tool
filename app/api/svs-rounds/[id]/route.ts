import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  const round = await prisma.svsRound.findUnique({
    where: { id },
    include: {
      timeSlots: {
        include: {
          rallyLeaders: { include: { participant: true } },
          garrisonLeaderVbv: true,
          garrisonLeaderCbs: true,
          garrisonMembers: { include: { participant: true } },
        },
      },
      participants: {
        include: { timeSlots: { include: { timeSlot: true } } },
      },
      rankings: { orderBy: { rank: "asc" } },
    },
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
  const authError = checkAdminAuth(req);
  if (authError) return authError;

  const id = Number(params.id);
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.roundName !== undefined) data.roundName = body.roundName;
  if (body.eventType !== undefined) data.eventType = body.eventType;
  if (body.eventDate !== undefined) {
    data.eventDate = body.eventDate ? new Date(body.eventDate) : null;
  }
  if (body.opponent !== undefined) data.opponent = body.opponent || null;
  if (body.status !== undefined) data.status = body.status || null;
  if (body.result !== undefined) data.result = body.result || null;

  const round = await prisma.svsRound.update({
    where: { id },
    data,
  });

  return NextResponse.json(round);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = checkAdminAuth(req);
  if (authError) return authError;

  const id = Number(params.id);
  await prisma.svsRound.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
