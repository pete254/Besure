// src/app/api/benefits/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { benefitOptions } from "@/drizzle/schema";
import { asc } from "drizzle-orm";
import { z } from "zod";

const benefitSchema = z.object({
  name: z.string().min(1, "Benefit name is required"),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
});

// GET /api/benefits
export async function GET() {
  try {
    const results = await db
      .select()
      .from(benefitOptions)
      .orderBy(asc(benefitOptions.sortOrder), asc(benefitOptions.name));
    return NextResponse.json({ benefits: results });
  } catch (error) {
    console.error("GET /api/benefits error:", error);
    return NextResponse.json({ error: "Failed to fetch benefits" }, { status: 500 });
  }
}

// POST /api/benefits
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = benefitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const [newBenefit] = await db
      .insert(benefitOptions)
      .values(parsed.data)
      .returning();

    return NextResponse.json({ benefit: newBenefit }, { status: 201 });
  } catch (error) {
    console.error("POST /api/benefits error:", error);
    return NextResponse.json({ error: "Failed to create benefit" }, { status: 500 });
  }
}