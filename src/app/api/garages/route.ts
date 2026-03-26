// src/app/api/garages/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { garages } from "@/drizzle/schema";
import { eq, asc, ilike, or } from "drizzle-orm";
import { z } from "zod";

const garageSchema = z.object({
  name: z.string().min(1, "Garage name is required"),
  location: z.string().optional().nullable(),
  county: z.string().optional().nullable(),
  contactPerson: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

// GET /api/garages
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const results = search
      ? await db.select().from(garages)
          .where(or(
            ilike(garages.name, `%${search}%`),
            ilike(garages.county, `%${search}%`),
            ilike(garages.location, `%${search}%`)
          ))
          .orderBy(asc(garages.name))
      : await db.select().from(garages).orderBy(asc(garages.name));

    return NextResponse.json({ garages: results });
  } catch (error) {
    console.error("GET /api/garages error:", error);
    return NextResponse.json({ error: "Failed to fetch garages" }, { status: 500 });
  }
}

// POST /api/garages
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = garageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const [newGarage] = await db
      .insert(garages)
      .values(parsed.data)
      .returning();

    return NextResponse.json({ garage: newGarage }, { status: 201 });
  } catch (error) {
    console.error("POST /api/garages error:", error);
    return NextResponse.json({ error: "Failed to create garage" }, { status: 500 });
  }
}

// PUT /api/garages/[id] — handled in [id]/route.ts