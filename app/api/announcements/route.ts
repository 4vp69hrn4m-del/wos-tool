import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(announcements);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.message || !body.message.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const announcement = await prisma.announcement.create({
    data: {
      message: body.message,
      authorName: body.authorName || null,
    },
  });

  return NextResponse.json(announcement);
}
