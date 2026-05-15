// src/app/api/commissions/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { commissions } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateCommissionSchema = z.object({
  status: z.enum(["Pending", "Paid"]).optional(),
  expectedDueDate: z.string().optional(),
  settledDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateCommissionSchema.parse(body);

    const updated = await db
      .update(commissions)
      .set({
        ...(parsed.status && { status: parsed.status }),
        ...(parsed.expectedDueDate && { expectedDueDate: parsed.expectedDueDate }),
        ...(parsed.settledDate !== undefined && { settledDate: parsed.settledDate }),
        ...(parsed.notes !== undefined && { notes: parsed.notes }),
        updatedAt: new Date(),
      })
      .where(eq(commissions.id, id))
      .returning();

    if (!updated.length) {
      return NextResponse.json(
        { error: "Commission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues },
        { status: 400 }
      );
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error updating commission:", errorMessage, error);
    return NextResponse.json(
      { error: `Failed to update commission: ${errorMessage}` },
      { status: 500 }
    );
  }
}
