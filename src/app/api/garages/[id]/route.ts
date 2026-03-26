// src/app/api/garages/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { garages } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateGarageSchema = z.object({
  name: z.string().min(1).optional(),
  location: z.string().optional().nullable(),
  county: z.string().optional().nullable(),
  contactPerson: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateGarageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(garages)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(garages.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Garage not found" }, { status: 404 });
    }

    return NextResponse.json({ garage: updated });
  } catch (error) {
    console.error("PUT /api/garages/[id] error:", error);
    return NextResponse.json({ error: "Failed to update garage" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [deleted] = await db
      .delete(garages)
      .where(eq(garages.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Garage not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/garages/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete garage" }, { status: 500 });
  }
}