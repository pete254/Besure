// src/app/api/insurers/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { insurers } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateInsurerSchema = z.object({
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  commissionRate: z.string().optional().nullable(),
  rateMotorPrivate: z.string().optional().nullable(),
  rateMotorCommercial: z.string().optional().nullable(),
  ratePsv: z.string().optional().nullable(),
  minPremiumPrivate: z.string().optional().nullable(),
  minPremiumCommercial: z.string().optional().nullable(),
  minPremiumPsv: z.string().optional().nullable(),
});

// PUT /api/insurers/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateInsurerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(insurers)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(insurers.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Insurer not found" }, { status: 404 });
    }

    return NextResponse.json({ insurer: updated });
  } catch (error) {
    console.error("PUT /api/insurers/[id] error:", error);
    return NextResponse.json({ error: "Failed to update insurer" }, { status: 500 });
  }
}

// DELETE /api/insurers/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [deleted] = await db
      .delete(insurers)
      .where(eq(insurers.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Insurer not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/insurers/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete insurer" }, { status: 500 });
  }
}