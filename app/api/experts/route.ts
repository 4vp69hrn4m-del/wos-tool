import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const experts = await prisma.expert.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(experts);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const expert = await prisma.expert.create({
    data: {
      name: body.name,
      notes: body.notes || null,
    },
  });
  return NextResponse.json(expert);
}
