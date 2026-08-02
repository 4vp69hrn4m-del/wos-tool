import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const heroes = await prisma.hero.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(heroes);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const hero = await prisma.hero.create({
    data: {
      name: body.name,
      troopType: body.troopType || null,
      notes: body.notes || null,
    },
  });
  return NextResponse.json(hero);
}
