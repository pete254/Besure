// src/app/api/benefits/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { benefitOptions } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateBenefitSchema = z.object({
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

// PUT /api/benefits/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateBenefitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(benefitOptions)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(benefitOptions.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Benefit not found" }, { status: 404 });
    }

    return NextResponse.json({ benefit: updated });
  } catch (error) {
    console.error("PUT /api/benefits/[id] error:", error);
    return NextResponse.json({ error: "Failed to update benefit" }, { status: 500 });
  }
}

// DELETE /api/benefits/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [deleted] = await db
      .delete(benefitOptions)
      .where(eq(benefitOptions.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Benefit not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/benefits/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete benefit" }, { status: 500 });
  }
}