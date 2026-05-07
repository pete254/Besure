// src/app/api/calculator/premium/route.ts
// Stateless premium calculation endpoint
// Formula: Grand Total = Basic Premium + Total Benefits + IRA Levy (0.45% of Basic+Benefits) + Stamp Duty (40) + PHCF (100)
// Training levy REMOVED per IRA regulations update

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { insurers } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const calcSchema = z.object({
  insuranceType: z.enum([
    "Motor - Private",
    "Motor - Private Comp",
    "Motor - Commercial",
    "Motor - PSV / Matatu",
    "Motor - Commercial Institutional",
    "Motor - Commercial TSV",
    "Motor - Commercial Third Party",
    "Medical / Health",
  ]),
  insurerId: z.string().uuid().optional().nullable(),
  sumInsured: z.number().min(0),
  basicRate: z.number().min(0),
  basicPremium: z.number().min(0).optional().nullable(),
  benefits: z
    .array(
      z.object({
        benefitName: z.string(),
        amountKes: z.number().min(0),
      })
    )
    .default([]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = calcSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { insuranceType, insurerId, sumInsured, basicRate, basicPremium, benefits } =
      parsed.data;

    // Fetch insurer details for minimum premium check
    let insurer = null;
    if (insurerId) {
      const [found] = await db
        .select()
        .from(insurers)
        .where(eq(insurers.id, insurerId));
      insurer = found;
    }

    // Determine minimum premium for this insurer + type
    let minPremium = 0;
    if (insurer) {
      if (insuranceType === "Motor - Private" || insuranceType === "Motor - Private Comp")
        minPremium = parseFloat(insurer.minPremiumPrivate || "0");
      else if (insuranceType === "Motor - Commercial")
        minPremium = parseFloat(insurer.minPremiumCommercial || "0");
      else if (insuranceType === "Motor - PSV / Matatu")
        minPremium = parseFloat(insurer.minPremiumPsv || "0");
    }

    // ── Core calculations ──────────────────────────────────────────
    const isMedicalType = insuranceType === "Medical / Health";

    // For medical, basicPremium is passed directly (no rate calculation)
    const calculatedBasicPremium = isMedicalType
      ? (basicPremium || 0)   // pass-through
      : (sumInsured * basicRate) / 100;
    
    const basicPremiumFinal = isMedicalType
      ? (basicPremium || 0)   // use passed premium directly
      : Math.max(calculatedBasicPremium, minPremium);
    
    const minimumApplied = !isMedicalType && calculatedBasicPremium < minPremium && minPremium > 0;

    const totalBenefits = benefits.reduce((s, b) => s + b.amountKes, 0);

    // IRA Levy = 0.45% of (Basic Premium + Total Benefits)
    const iraLevy = (basicPremiumFinal + totalBenefits) * 0.0045;

    // Fixed statutory charges
    const stampDuty = 40;
    const phcf = 0;  // PHCF removed per client request

    // Grand Total = Basic Premium + Benefits + IRA Levy + Stamp Duty
    // Training levy REMOVED, PHCF REMOVED
    const grandTotal = basicPremiumFinal + totalBenefits + iraLevy + stampDuty;

    // Agency commission (for display only — not charged to client)
    const commissionRate = parseFloat(insurer?.commissionRate || "0");
    const agencyCommission = (grandTotal * commissionRate) / 100;

    return NextResponse.json({
      sumInsured,
      basicRate: isMedicalType ? null : basicRate,
      basicPremium: basicPremium || null,
      calculatedBasicPremium: parseFloat(calculatedBasicPremium.toFixed(2)),
      basicPremiumFinal: parseFloat(basicPremiumFinal.toFixed(2)),
      minimumApplied,
      minPremium: minimumApplied ? minPremium : null,
      totalBenefits: parseFloat(totalBenefits.toFixed(2)),
      iraLevy: parseFloat(iraLevy.toFixed(2)),
      // trainingLevy removed — kept as 0 for schema compatibility
      trainingLevy: 0,
      stampDuty,
      phcf,
      grandTotal: parseFloat(grandTotal.toFixed(2)),
      agencyCommission: parseFloat(agencyCommission.toFixed(2)),
      commissionRate,
      benefits,
      insurer: insurer ? { id: insurer.id, name: insurer.name } : null,
    });
  } catch (error) {
    console.error("POST /api/calculator/premium error:", error);
    return NextResponse.json(
      { error: "Calculation failed" },
      { status: 500 }
    );
  }
}