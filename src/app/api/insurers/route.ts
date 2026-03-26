// src/app/api/insurers/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { insurers } from "@/drizzle/schema";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";

const insurerSchema = z.object({
  name: z.string().min(1, "Insurer name is required"),
  isActive: z.boolean().default(true),
  commissionRate: z.string().optional().nullable(),
  rateMotorPrivate: z.string().optional().nullable(),
  rateMotorCommercial: z.string().optional().nullable(),
  ratePsv: z.string().optional().nullable(),
  minPremiumPrivate: z.string().optional().nullable(),
  minPremiumCommercial: z.string().optional().nullable(),
  minPremiumPsv: z.string().optional().nullable(),
});

// GET /api/insurers
export async function GET() {
  try {
    const results = await db
      .select()
      .from(insurers)
      .orderBy(asc(insurers.name));
    return NextResponse.json({ insurers: results });
  } catch (error) {
    console.error("GET /api/insurers error:", error);
    return NextResponse.json({ error: "Failed to fetch insurers" }, { status: 500 });
  }
}

// POST /api/insurers
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = insurerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const [newInsurer] = await db
      .insert(insurers)
      .values(parsed.data)
      .returning();

    return NextResponse.json({ insurer: newInsurer }, { status: 201 });
  } catch (error) {
    console.error("POST /api/insurers error:", error);
    return NextResponse.json({ error: "Failed to create insurer" }, { status: 500 });
  }
}