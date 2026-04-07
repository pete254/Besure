// src/app/api/policies/[id]/renew/route.ts
// Creates a renewal policy based on an existing policy

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  policies,
  vehicles,
  policyBenefits,
  payments,
} from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const renewSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  sumInsured: z.string().optional().nullable(),
  basicRate: z.string().optional().nullable(),
  basicPremium: z.string().optional().nullable(),
  iraLevy: z.string().optional().nullable(),
  trainingLevy: z.string().optional().nullable(),
  stampDuty: z.string().default("40"),
  phcf: z.string().default("100"),
  grandTotal: z.string().optional().nullable(),
  paymentMode: z.enum(["Full Payment", "2 Installments", "3 Installments", "IPF"]),
  policyNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  // Allow overriding benefits for renewal
  benefits: z
    .array(
      z.object({
        benefitOptionId: z.string().optional().nullable(),
        benefitName: z.string(),
        amountKes: z.string(),
      })
    )
    .optional(),
  totalBenefits: z.string().default("0"),
});

// POST /api/policies/[id]/renew
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = renewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    // Fetch the original policy
    const [original] = await db
      .select()
      .from(policies)
      .where(eq(policies.id, id));

    if (!original) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    const data = parsed.data;

    // Fetch original vehicle and benefits
    const [originalVehicle] = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.policyId, id));

    const originalBenefits = await db
      .select()
      .from(policyBenefits)
      .where(eq(policyBenefits.policyId, id));

    // Create the renewal policy (copy most fields, override dates/premium)
    const [renewedPolicy] = await db
      .insert(policies)
      .values({
        customerId: original.customerId,
        insurerId: original.insurerId,
        insurerNameManual: original.insurerNameManual,
        insuranceType: original.insuranceType,
        coverType: original.coverType,
        policyNumber: data.policyNumber || null,
        startDate: data.startDate,
        endDate: data.endDate,
        sumInsured: data.sumInsured || original.sumInsured,
        basicRate: data.basicRate || original.basicRate,
        basicPremium: data.basicPremium || original.basicPremium,
        totalBenefits: data.totalBenefits,
        iraLevy: data.iraLevy || original.iraLevy,
        trainingLevy: data.trainingLevy || original.trainingLevy,
        stampDuty: data.stampDuty,
        phcf: data.phcf,
        grandTotal: data.grandTotal || original.grandTotal,
        paymentMode: data.paymentMode,
        ipfProvider: original.ipfProvider,
        ipfLoanReference: original.ipfLoanReference,
        notes: data.notes || `Renewal of policy from ${original.startDate} – ${original.endDate}`,
        status: "Active",
      })
      .returning();

    // Copy vehicle if motor policy
    if (originalVehicle) {
      await db.insert(vehicles).values({
        policyId: renewedPolicy.id,
        make: originalVehicle.make,
        model: originalVehicle.model,
        year: originalVehicle.year,
        cc: originalVehicle.cc,
        tonnage: originalVehicle.tonnage,
        seats: originalVehicle.seats,
        chassisNo: originalVehicle.chassisNo,
        engineNo: originalVehicle.engineNo,
        regNo: originalVehicle.regNo,
        bodyType: originalVehicle.bodyType,
        colour: originalVehicle.colour,
        // Don't copy logbook URL — fresh upload required for renewals
      });
    }

    // Copy benefits (use override if provided)
    const benefitsToInsert = data.benefits || originalBenefits;
    if (benefitsToInsert.length > 0) {
      await db.insert(policyBenefits).values(
        benefitsToInsert.map((b) => ({
          policyId: renewedPolicy.id,
          benefitOptionId: (b as any).benefitOptionId || null,
          benefitName: b.benefitName,
          amountKes: b.amountKes,
        }))
      );
    }

    // Create payment schedule
    const total = parseFloat(data.grandTotal || "0");
    if (data.paymentMode === "Full Payment") {
      await db.insert(payments).values({
        policyId: renewedPolicy.id,
        installmentNumber: 1,
        totalInstallments: 1,
        amountDue: data.grandTotal || "0",
        dueDate: data.startDate,
        status: "pending",
      });
    } else if (data.paymentMode === "2 Installments") {
      const half = (total / 2).toFixed(2);
      const d2 = new Date(data.startDate);
      d2.setDate(d2.getDate() + 30);
      await db.insert(payments).values([
        { policyId: renewedPolicy.id, installmentNumber: 1, totalInstallments: 2, amountDue: half, dueDate: data.startDate, status: "pending" },
        { policyId: renewedPolicy.id, installmentNumber: 2, totalInstallments: 2, amountDue: half, dueDate: d2.toISOString().split("T")[0], status: "pending" },
      ]);
    } else if (data.paymentMode === "3 Installments") {
      const t1 = (total / 3).toFixed(2);
      const t2 = (total / 3).toFixed(2);
      const t3 = (total - parseFloat(t1) - parseFloat(t2)).toFixed(2);
      const d2 = new Date(data.startDate); d2.setDate(d2.getDate() + 30);
      const d3 = new Date(data.startDate); d3.setDate(d3.getDate() + 60);
      await db.insert(payments).values([
        { policyId: renewedPolicy.id, installmentNumber: 1, totalInstallments: 3, amountDue: t1, dueDate: data.startDate, status: "pending" },
        { policyId: renewedPolicy.id, installmentNumber: 2, totalInstallments: 3, amountDue: t2, dueDate: d2.toISOString().split("T")[0], status: "pending" },
        { policyId: renewedPolicy.id, installmentNumber: 3, totalInstallments: 3, amountDue: t3, dueDate: d3.toISOString().split("T")[0], status: "pending" },
      ]);
    }

    // Mark original policy as Expired if it isn't already
    if (original.status === "Active") {
      await db
        .update(policies)
        .set({ status: "Expired", updatedAt: new Date() })
        .where(eq(policies.id, id));
    }

    return NextResponse.json(
      { policy: renewedPolicy, originalPolicyId: id },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/policies/[id]/renew error:", error);
    return NextResponse.json(
      { error: "Failed to create renewal policy" },
      { status: 500 }
    );
  }
}