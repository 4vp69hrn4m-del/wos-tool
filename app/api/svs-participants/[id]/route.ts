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
  await prisma.svsParticipant.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

// 参加希望同盟(vbv/cbs)の移動。管理者パスワード必須。
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = checkAdminAuth(req);
  if (authError) return authError;

  const id = Number(params.id);
  const body = await req.json();

  if (body.alliance !== "vbv" && body.alliance !== "cbs") {
    return NextResponse.json(
      { error: "alliance must be 'vbv' or 'cbs'" },
      { status: 400 }
    );
  }

  const participant = await prisma.svsParticipant.update({
    where: { id },
    data: { alliance: body.alliance },
  });

  return NextResponse.json(participant);
}
