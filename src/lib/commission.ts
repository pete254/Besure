/**
 * Commission calculation and storage utilities
 */

import { db } from "@/lib/db";
import {
  commissions,
  policies,
  customers,
  insurers,
} from "@/drizzle/schema";
import { eq, isNull, isNotNull, and } from "drizzle-orm";
import { v4 as uuid } from "uuid";

export interface CommissionData {
  policyId: string;
  customerId: string;
  insurerId: string | null;
  commissionAmount: string; // Stored as numeric in DB, kept as string for precision
  expectedDueDate: string; // ISO date: YYYY-MM-DD
  notes?: string;
}

/**
 * Calculate commission for a single policy based on insurer rate
 * Formula: (Grand Total * Commission Rate) / 100
 */
export async function calculateCommissionForPolicy(policyId: string) {
  console.log(`[Commission.calc] Fetching policy data for: ${policyId}`);
  
  const policy = await db
    .select({
      policy: policies,
      customer: { id: customers.id },
      insurer: { id: insurers.id, commissionRate: insurers.commissionRate },
    })
    .from(policies)
    .leftJoin(customers, eq(policies.customerId, customers.id))
    .leftJoin(insurers, eq(policies.insurerId, insurers.id))
    .where(eq(policies.id, policyId))
    .then((r) => r[0]);

  if (!policy) {
    throw new Error(`Policy not found: ${policyId}`);
  }

  console.log(`[Commission.calc] Policy data:`, {
    grandTotal: policy.policy.grandTotal,
    customerId: policy.customer?.id,
    insurerId: policy.insurer?.id,
    commissionRate: policy.insurer?.commissionRate,
  });

  const grandTotal = parseFloat(policy.policy.grandTotal || "0");
  const commissionRate = parseFloat(policy.insurer?.commissionRate || "0");

  if (!policy.customer) {
    throw new Error(`Policy has no customer: ${policyId}`);
  }

  // Calculate commission
  const commissionAmount = (grandTotal * commissionRate) / 100;

  // Calculate expected due date (commission due 30 days after policy start)
  const startDate = new Date(policy.policy.startDate);
  const expectedDueDate = new Date(startDate);
  expectedDueDate.setDate(expectedDueDate.getDate() + 30);
  const expectedDueDateStr = expectedDueDate.toISOString().split("T")[0];

  console.log(`[Commission.calc] Calculated commission:`, {
    commissionAmount: commissionAmount.toFixed(2),
    expectedDueDate: expectedDueDateStr,
  });

  return {
    policyId: policy.policy.id,
    customerId: policy.customer.id,
    insurerId: policy.insurer?.id || null,
    commissionAmount: commissionAmount.toFixed(2),
    expectedDueDate: expectedDueDateStr,
  };
}

/**
 * Store a calculated commission in the database
 */
export async function storeCommission(data: CommissionData) {
  console.log(`[Commission.store] Storing commission:`, data);
  
  const result = await db
    .insert(commissions)
    .values({
      id: uuid(),
      policyId: data.policyId,
      customerId: data.customerId,
      insurerId: data.insurerId,
      commissionAmount: data.commissionAmount,
      expectedDueDate: data.expectedDueDate,
      notes: data.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  console.log(`[Commission.store] Stored successfully with ID: ${result[0]?.id}`);
  return result[0];
}

/**
 * Calculate and store commission for a policy
 * Returns the created commission record
 */
export async function calculateAndStoreCommission(policyId: string) {
  const calculated = await calculateCommissionForPolicy(policyId);
  const stored = await storeCommission(calculated);
  return stored;
}

/**
 * Generate commissions for all policies that don't have one yet
 * Called by cron job or manual trigger
 */
export async function generateMissingCommissions() {
  console.log("[Commission] Starting generateMissingCommissions...");
  
  // Get all active policies that have insurers
  const allPolicies = await db
    .select({
      id: policies.id,
    })
    .from(policies)
    .where(
      and(
        eq(policies.status, "Active"),
        isNotNull(policies.insurerId) // Only policies with insurers should have commissions
      )
    );

  console.log(`[Commission] Found ${allPolicies.length} active policies with insurers`);

  // Check which policies already have commissions
  const policiesWithCommissions = await db
    .select({ policyId: commissions.policyId })
    .from(commissions);

  console.log(`[Commission] Found ${policiesWithCommissions.length} existing commissions`);

  const existingPolicyIds = new Set(
    policiesWithCommissions.map((c) => c.policyId)
  );

  // Calculate for policies without commissions
  const toGenerate = allPolicies.filter(
    (p) => !existingPolicyIds.has(p.id)
  );

  console.log(`[Commission] Need to generate ${toGenerate.length} new commissions`);

  const results = [];
  let successCount = 0;
  let errorCount = 0;
  const errors: Record<string, string> = {};

  for (const policy of toGenerate) {
    try {
      console.log(`[Commission] Calculating for policy: ${policy.id}`);
      const commission = await calculateAndStoreCommission(policy.id);
      console.log(`[Commission] Successfully created commission: ${commission.id}`);
      results.push(commission);
      successCount++;
    } catch (error) {
      errorCount++;
      const errMsg = error instanceof Error ? error.message : String(error);
      errors[policy.id] = errMsg;
      console.error(`[Commission] Failed to generate commission for policy ${policy.id}:`, error);
    }
  }

  console.log(`[Commission] Completed: ${successCount} success, ${errorCount} failed`);

  return {
    successCount,
    errorCount,
    errors: errorCount > 0 ? errors : undefined,
    generated: results,
  };
}

/**
 * Regenerate commissions for all policies with insurers
 * This will overwrite existing commissions
 */
export async function regenerateAllCommissions() {
  // Get all policies with insurers
  const allPolicies = await db
    .select({
      id: policies.id,
      customerId: policies.customerId,
      insurerId: insurers.id,
      grandTotal: policies.grandTotal,
      startDate: policies.startDate,
      commissionRate: insurers.commissionRate,
    })
    .from(policies)
    .leftJoin(customers, eq(policies.customerId, customers.id))
    .leftJoin(insurers, eq(policies.insurerId, insurers.id))
    .where(
      and(
        eq(policies.status, "Active"),
        isNotNull(policies.customerId), // Customer must exist
        isNotNull(policies.insurerId) // Insurer must exist
      )
    );

  const results = [];
  let successCount = 0;
  let errorCount = 0;
  const errors: Record<string, string> = {};

  for (const policy of allPolicies) {
    try {
      const grandTotal = parseFloat(policy.grandTotal || "0");
      const commissionRate = parseFloat(policy.commissionRate || "0");
      const commissionAmount = (grandTotal * commissionRate) / 100;

      // Calculate expected due date
      const startDate = new Date(policy.startDate);
      const expectedDueDate = new Date(startDate);
      expectedDueDate.setDate(expectedDueDate.getDate() + 30);
      const expectedDueDateStr = expectedDueDate
        .toISOString()
        .split("T")[0];

      // Delete existing commission if any
      await db
        .delete(commissions)
        .where(eq(commissions.policyId, policy.id));

      // Create new commission
      const commission = await storeCommission({
        policyId: policy.id,
        customerId: policy.customerId,
        insurerId: policy.insurerId,
        commissionAmount: commissionAmount.toFixed(2),
        expectedDueDate: expectedDueDateStr,
      });

      results.push(commission);
      successCount++;
    } catch (error) {
      errorCount++;
      const errMsg = error instanceof Error ? error.message : String(error);
      errors[policy.id] = errMsg;
      console.error(`Failed to regenerate commission for policy ${policy.id}:`, error);
    }
  }

  return {
    successCount,
    errorCount,
    errors: errorCount > 0 ? errors : undefined,
    regenerated: results,
  };
}

/**
 * Recalculate all commissions with a new rate
 * This overwrites existing commissions with new calculations based on the provided rate
 */
export async function recalculateCommissionsWithRate(ratePercent: number) {
  console.log(`[Commission] Starting recalculation with rate: ${ratePercent}%`);

  // Get all active commissions with their policy premium information
  const allCommissions = await db
    .select({
      commission: commissions,
      policy: {
        id: policies.id,
        grandTotal: policies.grandTotal,
        startDate: policies.startDate,
      },
    })
    .from(commissions)
    .innerJoin(policies, eq(commissions.policyId, policies.id));

  const results = [];
  let successCount = 0;
  let errorCount = 0;
  const errors: Record<string, string> = {};

  for (const item of allCommissions) {
    try {
      const grandTotal = parseFloat(item.policy.grandTotal || "0");
      const newCommissionAmount = (grandTotal * ratePercent) / 100;

      // Update the commission
      const updated = await db
        .select()
        .from(commissions)
        .where(eq(commissions.id, item.commission.id));

      if (updated.length > 0) {
        // Update existing commission with new amount
        const result = await db
          .select()
          .from(commissions)
          .where(eq(commissions.id, item.commission.id))
          .then((rows) => rows[0]);

        // Execute the update
        await db
          .update(commissions)
          .set({
            commissionAmount: newCommissionAmount.toFixed(2),
            updatedAt: new Date(),
          })
          .where(eq(commissions.id, item.commission.id));

        // Fetch the updated record
        const updatedCommission = await db
          .select()
          .from(commissions)
          .where(eq(commissions.id, item.commission.id))
          .then((rows) => rows[0]);

        results.push(updatedCommission);
        successCount++;
      }
    } catch (error) {
      errorCount++;
      const errMsg = error instanceof Error ? error.message : String(error);
      errors[item.commission.id] = errMsg;
      console.error(`[Commission] Failed to recalculate commission ${item.commission.id}:`, error);
    }
  }

  console.log(`[Commission] Recalculation completed: ${successCount} success, ${errorCount} failed`);

  return {
    successCount,
    errorCount,
    errors: errorCount > 0 ? errors : undefined,
    recalculated: results,
    message: `Recalculated ${successCount} commissions with rate ${ratePercent}%`,
  };
}
