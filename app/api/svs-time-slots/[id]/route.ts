import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = checkAdminAuth(req);
  if (authError) return authError;

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
      garrisonLeaderVbvId: toIntOrNull(body.garrisonLeaderVbvId),
      garrisonLeaderVbvUsePet: !!body.garrisonLeaderVbvUsePet,
      garrisonLeaderCbsId: toIntOrNull(body.garrisonLeaderCbsId),
      garrisonLeaderCbsUsePet: !!body.garrisonLeaderCbsUsePet,
    },
  });

  if (Array.isArray(body.rallyLeaders)) {
    const rallyLeaders: { participantId: number; usePet: boolean }[] = body.rallyLeaders
      .map((r: { participantId: unknown; usePet: unknown }) => ({
        participantId: Number(r.participantId),
        usePet: !!r.usePet,
      }))
      .filter((r: { participantId: number }) => !Number.isNaN(r.participantId));

    await prisma.svsRallyLeader.deleteMany({ where: { timeSlotId: id } });
    if (rallyLeaders.length > 0) {
      await prisma.svsRallyLeader.createMany({
        data: rallyLeaders.map((r) => ({
          timeSlotId: id,
          participantId: r.participantId,
          usePet: r.usePet,
        })),
      });
    }
  }

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
  const authError = checkAdminAuth(req);
  if (authError) return authError;

  const id = Number(params.id);
  await prisma.svsTimeSlot.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
