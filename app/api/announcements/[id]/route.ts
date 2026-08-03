import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = checkAdminAuth(req);
  if (authError) return authError;

  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  await prisma.announcement.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
