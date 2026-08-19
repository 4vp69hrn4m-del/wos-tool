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

  const data: Record<string, unknown> = {};
  if (body.playerName !== undefined) data.playerName = body.playerName;
  if (body.rank !== undefined) {
    data.rank = body.rank !== "" ? Number(body.rank) : null;
  }

  const ranking = await prisma.svsRanking.update({ where: { id }, data });
  return NextResponse.json(ranking);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = checkAdminAuth(req);
  if (authError) return authError;

  const id = Number(params.id);
  await prisma.svsRanking.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
