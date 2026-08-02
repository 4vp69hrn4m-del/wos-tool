import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const formations = await prisma.formation.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(formations);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const toInt = (v: unknown) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  const formation = await prisma.formation.create({
    data: {
      label: body.label || null,
      side: body.side || "self",
      formationType: body.formationType || null,
      hero1Name: body.hero1Name || null,
      hero2Name: body.hero2Name || null,
      hero3Name: body.hero3Name || null,
      expertName: body.expertName || null,
      petName: body.petName || null,
      infantryPct: toInt(body.infantryPct),
      cavalryPct: toInt(body.cavalryPct),
      archerPct: toInt(body.archerPct),
      equipmentNote: body.equipmentNote || null,
    },
  });

  return NextResponse.json(formation);
}
