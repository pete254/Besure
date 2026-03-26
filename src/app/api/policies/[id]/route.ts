// src/app/api/policies/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { policies, customers, vehicles, insurers, policyBenefits, payments, policyDocuments } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// GET /api/policies/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [policy] = await db
      .select()
      .from(policies)
      .where(eq(policies.id, id));

    if (!policy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    // Fetch related data in parallel
    const [customer, vehicle, benefits, paymentList, insurer] = await Promise.all([
      db.select().from(customers).where(eq(customers.id, policy.customerId)).then(r => r[0]),
      db.select().from(vehicles).where(eq(vehicles.policyId, id)).then(r => r[0]),
      db.select().from(policyBenefits).where(eq(policyBenefits.policyId, id)),
      db.select().from(payments).where(eq(payments.policyId, id)),
      policy.insurerId
        ? db.select().from(insurers).where(eq(insurers.id, policy.insurerId)).then(r => r[0])
        : Promise.resolve(null),
    ]);

    return NextResponse.json({ policy, customer, vehicle, benefits, payments: paymentList, insurer });
  } catch (error) {
    console.error("GET /api/policies/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch policy" }, { status: 500 });
  }
}

// PUT /api/policies/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const [updated] = await db
      .update(policies)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(policies.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    return NextResponse.json({ policy: updated });
  } catch (error) {
    console.error("PUT /api/policies/[id] error:", error);
    return NextResponse.json({ error: "Failed to update policy" }, { status: 500 });
  }
}

// DELETE /api/policies/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [deleted] = await db
      .delete(policies)
      .where(eq(policies.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/policies/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete policy" }, { status: 500 });
  }
}