// src/app/api/policies/[id]/certificate-expiry/route.ts
// Update certificate expiry date and reason

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { policies } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateCertificateExpirySchema = z.object({
  certificateExpiryDate: z.string().min(1, "Certificate expiry date is required"),
  certificateExpiryReason: z.string().optional().nullable(),
});

// PATCH /api/policies/[id]/certificate-expiry
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateCertificateExpirySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Update the policy with new certificate expiry details
    const [updated] = await db
      .update(policies)
      .set({
        certificateExpiryDate: data.certificateExpiryDate,
        certificateExpiryReason: data.certificateExpiryReason || null,
        updatedAt: new Date(),
      })
      .where(eq(policies.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Policy not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ policy: updated });
  } catch (error) {
    console.error("PATCH /api/policies/[id]/certificate-expiry error:", error);
    return NextResponse.json(
      { error: "Failed to update certificate expiry" },
      { status: 500 }
    );
  }
}
