import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  const body = await req.json();

  const toIntOrNull = (v: unknown) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  const timeSlot = await prisma.svsTimeSlot.update({
    where: { id },
    data: {
      rallyLeaderId: toIntOrNull(body.rallyLeaderId),
      rallyLeaderUsePet: !!body.rallyLeaderUsePet,
      garrisonLeaderId: toIntOrNull(body.garrisonLeaderId),
      garrisonLeaderUsePet: !!body.garrisonLeaderUsePet,
    },
  });

  if (Array.isArray(body.garrisonMemberIds)) {
    const ids: number[] = body.garrisonMemberIds
      .map((v: unknown) => Number(v))
      .filter((n: number) => !Number.isNaN(n));

    await prisma.svsGarrisonMember.deleteMany({ where: { timeSlotId: id } });
    if (ids.length > 0) {
      await prisma.svsGarrisonMember.createMany({
        data: ids.map((participantId) => ({ timeSlotId: id, participantId })),
      });
    }
  }

  return NextResponse.json(timeSlot);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  await prisma.svsTimeSlot.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
