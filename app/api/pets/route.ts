import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const pets = await prisma.pet.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(pets);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const pet = await prisma.pet.create({
    data: {
      name: body.name,
      skill: body.skill || null,
      notes: body.notes || null,
    },
  });
  return NextResponse.json(pet);
}
