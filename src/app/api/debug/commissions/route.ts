/**
 * DEBUG endpoint to check commission data
 * GET /api/debug/commissions
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { policies, insurers, commissions } from "@/drizzle/schema";
import { eq, isNotNull, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    // Count all policies
    const allPoliciesCount = await db.select().from(policies);
    
    // Count active policies
    const activePolicies = await db
      .select()
      .from(policies)
      .where(eq(policies.status, "Active"));
    
    // Count active policies with insurers
    const activePoliciesWithInsurers = await db
      .select()
      .from(policies)
      .where(
        and(
          eq(policies.status, "Active"),
          isNotNull(policies.insurerId)
        )
      );
    
    // Get insurers with commission rates
    const insurersWithRates = await db
      .select()
      .from(insurers)
      .where(isNotNull(insurers.commissionRate));
    
    // Count commissions
    const commissionsCount = await db.select().from(commissions);
    
    // Sample active policies with insurers
    const sample = await db
      .select({
        policyId: policies.id,
        policyNumber: policies.policyNumber,
        status: policies.status,
        insurerId: policies.insurerId,
        grandTotal: policies.grandTotal,
        insurerName: insurers.name,
        commissionRate: insurers.commissionRate,
      })
      .from(policies)
      .leftJoin(insurers, eq(policies.insurerId, insurers.id))
      .where(eq(policies.status, "Active"))
      .limit(5);
    
    return NextResponse.json({
      summary: {
        totalPolicies: allPoliciesCount.length,
        activePolicies: activePolicies.length,
        activePoliciesWithInsurers: activePoliciesWithInsurers.length,
        insurersWithRates: insurersWithRates.length,
        totalCommissions: commissionsCount.length,
      },
      insurersWithRates: insurersWithRates.map((i) => ({
        id: i.id,
        name: i.name,
        commissionRate: i.commissionRate,
      })),
      activePoliciesSample: sample,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Debug commissions error:", errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
