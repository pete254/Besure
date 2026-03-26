// src/app/api/policies/[id]/payments/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { payments } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const recordPaymentSchema = z.object({
  paymentId: z.string().uuid(),
  amountPaid: z.string(),
  paidDate: z.string(),
  paymentMethod: z.string().min(1, "Payment method is required"),
  referenceNo: z.string().optional().nullable(),
});

// GET /api/policies/[id]/payments
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const results = await db
      .select()
      .from(payments)
      .where(eq(payments.policyId, id));
    return NextResponse.json({ payments: results });
  } catch (error) {
    console.error("GET /api/policies/[id]/payments error:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

// POST /api/policies/[id]/payments — record a payment against an installment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params; // ensure params resolved
    const body = await req.json();
    const parsed = recordPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { paymentId, amountPaid, paidDate, paymentMethod, referenceNo } = parsed.data;

    // Fetch the installment
    const [installment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId));

    if (!installment) {
      return NextResponse.json({ error: "Payment installment not found" }, { status: 404 });
    }

    const due = parseFloat(installment.amountDue);
    const paid = parseFloat(amountPaid);
    const status = paid >= due ? "paid" : "partial";

    const [updated] = await db
      .update(payments)
      .set({
        amountPaid,
        paidDate,
        paymentMethod,
        referenceNo: referenceNo || null,
        status,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId))
      .returning();

    return NextResponse.json({ payment: updated });
  } catch (error) {
    console.error("POST /api/policies/[id]/payments error:", error);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}