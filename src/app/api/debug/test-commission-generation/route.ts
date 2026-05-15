/**
 * TEST endpoint to debug commission generation
 * POST /api/debug/test-commission-generation
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { policies, customers, insurers, commissions } from "@/drizzle/schema";
import { eq, isNotNull, and } from "drizzle-orm";
import { calculateAndStoreCommission } from "@/lib/commission";

export async function POST(req: NextRequest) {
  try {
    const startTime = Date.now();
    const logs: string[] = [];
    
    function log(msg: string) {
      logs.push(msg);
      console.log(msg);
    }

    log("[TEST] Starting commission generation test...");

    // Step 1: Get all active policies with insurers
    log("[TEST] Step 1: Fetching active policies with insurers...");
    const allPolicies = await db
      .select({
        id: policies.id,
        policyNumber: policies.policyNumber,
        grandTotal: policies.grandTotal,
        customerId: policies.customerId,
        insurerId: policies.insurerId,
      })
      .from(policies)
      .where(
        and(
          eq(policies.status, "Active"),
          isNotNull(policies.insurerId)
        )
      );

    log(`[TEST] Found ${allPolicies.length} active policies with insurers`);
    allPolicies.forEach((p) => {
      log(`  - Policy: ${p.id}, Grand Total: ${p.grandTotal}, Insurer: ${p.insurerId}`);
    });

    // Step 2: Check which already have commissions
    log("[TEST] Step 2: Checking existing commissions...");
    const existingCommissions = await db
      .select({ policyId: commissions.policyId })
      .from(commissions);

    log(`[TEST] Found ${existingCommissions.length} existing commissions`);
    existingCommissions.forEach((c) => {
      log(`  - Commission for policy: ${c.policyId}`);
    });

    const existingPolicyIds = new Set(
      existingCommissions.map((c) => c.policyId)
    );

    // Step 3: Identify policies to generate
    const toGenerate = allPolicies.filter(
      (p) => !existingPolicyIds.has(p.id)
    );

    log(`[TEST] Step 3: Need to generate ${toGenerate.length} commissions`);

    // Step 4: Try to generate each one
    log("[TEST] Step 4: Generating commissions...");
    const results = [];
    const errors: Array<{ policyId: string; error: string; stack?: string }> = [];

    for (const policy of toGenerate) {
      try {
        log(`[TEST] Generating for policy: ${policy.id}`);
        const commission = await calculateAndStoreCommission(policy.id);
        log(`[TEST] ✓ Successfully created commission: ${commission.id}`);
        results.push(commission);
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        log(`[TEST] ✗ FAILED for policy ${policy.id}: ${errMsg}`);
        errors.push({
          policyId: policy.id,
          error: errMsg,
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    }

    const duration = Date.now() - startTime;
    log(`[TEST] Completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      duration,
      summary: {
        activePoliciesWithInsurers: allPolicies.length,
        existingCommissions: existingCommissions.length,
        toGenerate: toGenerate.length,
        generated: results.length,
        failed: errors.length,
      },
      policies: allPolicies.map((p) => ({
        ...p,
        hasExistingCommission: existingPolicyIds.has(p.id),
      })),
      generated: results,
      errors: errors.length > 0 ? errors : undefined,
      logs,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Test error:", errorMessage, error);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
