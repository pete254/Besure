// src/app/api/customers/[id]/policies/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { policies, vehicles, insurers, payments } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await db
      .select({
        policy: policies,
        vehicle: vehicles,
        insurer: {
          id: insurers.id,
          name: insurers.name,
        },
      })
      .from(policies)
      .leftJoin(vehicles, eq(vehicles.policyId, policies.id))
      .leftJoin(insurers, eq(policies.insurerId, insurers.id))
      .where(eq(policies.customerId, id))
      .orderBy(desc(policies.createdAt));

    // For each policy, get payment summary
    const enriched = await Promise.all(
      result.map(async (r) => {
        const policyPayments = await db
          .select()
          .from(payments)
          .where(eq(payments.policyId, r.policy.id));

        const totalDue = policyPayments.reduce(
          (s, p) => s + parseFloat(p.amountDue),
          0
        );
        const totalPaid = policyPayments.reduce(
          (s, p) => s + parseFloat(p.amountPaid || "0"),
          0
        );
        const outstanding = Math.max(totalDue - totalPaid, 0);
        const allPaid = policyPayments.length > 0 && policyPayments.every((p) => p.status === "paid");

        return {
          ...r,
          paymentSummary: {
            totalDue,
            totalPaid,
            outstanding,
            allPaid,
            installmentCount: policyPayments.length,
          },
        };
      })
    );

    return NextResponse.json({ policies: enriched });
  } catch (error) {
    console.error("GET /api/customers/[id]/policies error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer policies" },
      { status: 500 }
    );
  }
}