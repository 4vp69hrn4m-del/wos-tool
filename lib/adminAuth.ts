import { NextRequest, NextResponse } from "next/server";

// 削除・編集(DELETE/PATCH)の前に呼び出す。
// パスワードが違えば401エラーのレスポンスを返し、
// 呼び出し元はそれをそのままreturnする。合っていればnullを返す。
export function checkAdminAuth(req: NextRequest): NextResponse | null {
  const password = req.headers.get("x-admin-password");
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "管理者パスワードが違います" },
      { status: 401 }
    );
  }
  return null;
}
