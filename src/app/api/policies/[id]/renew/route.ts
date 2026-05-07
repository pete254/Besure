// src/app/api/policies/[id]/renew/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { policies, vehicles, policyBenefits, payments, policyDocuments } from "@/drizzle/schema";
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
  phcf: z.string().default("0"),
  grandTotal: z.string().optional().nullable(),
  totalBenefits: z.string().default("0"),
  paymentMode: z.enum(["Full Payment", "2 Installments", "3 Installments", "IPF"]),
  policyNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  medicalMeta: z.any().optional().nullable(),
  benefits: z.array(z.object({
    benefitOptionId: z.string().optional().nullable(),
    benefitName: z.string(),
    amountKes: z.string(),
  })).optional(),
  carryOverDocIds: z.array(z.string()).default([]),
});

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
    const [original] = await db.select().from(policies).where(eq(policies.id, id));

    if (!original) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    // BLOCK: If already renewed, prevent double renewal
    if (original.renewedByPolicyId) {
      return NextResponse.json(
        { error: "This policy has already been renewed and cannot be renewed again." },
        { status: 409 }
      );
    }

    const data = parsed.data;

    const [originalVehicle] = await db
      .select().from(vehicles).where(eq(vehicles.policyId, id));

    const originalBenefits = await db
      .select().from(policyBenefits).where(eq(policyBenefits.policyId, id));

    // Create the renewal policy
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
        certificateExpiryDate: data.endDate,
        certificateExpiryReason: null,
        notes: data.notes || `Renewal of policy from ${original.startDate} – ${original.endDate}`,
        medicalMeta: data.medicalMeta || original.medicalMeta || null,
        // NEW: The renewal starts as Active (will be "Pending" visually if start date is future)
        status: "Active",
        // NEW: Link back to the original policy
        renewsPolicyId: id,
      })
      .returning();

    // NEW: Mark the original policy as renewed (link forward)
    await db
      .update(policies)
      .set({ 
        renewedByPolicyId: renewedPolicy.id,
        updatedAt: new Date(),
      })
      .where(eq(policies.id, id));

    // Copy vehicle
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
      });
    }

    // Copy/override benefits
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

    // Carry over documents
    if (data.carryOverDocIds.length > 0) {
      const existingDocs = await db
        .select().from(policyDocuments).where(eq(policyDocuments.policyId, id));
      const docsToCarry = existingDocs.filter(d => data.carryOverDocIds.includes(d.id));
      if (docsToCarry.length > 0) {
        await db.insert(policyDocuments).values(
          docsToCarry.map(d => ({
            policyId: renewedPolicy.id,
            docType: d.docType,
            docLabel: d.docLabel,
            status: d.status,
            fileUrl: d.fileUrl,
            blobKey: d.blobKey,
            receivedDate: d.receivedDate,
          }))
        );
      }
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

    // NOTE: We do NOT mark original as Expired here anymore.
    // The original stays Active until its end_date passes.
    // The UI handles "Pending" display logic based on start date vs today.

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