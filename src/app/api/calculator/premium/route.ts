// src/app/api/calculator/premium/route.ts
// Stateless premium calculation endpoint

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { insurers } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const calcSchema = z.object({
  insuranceType: z.enum([
    "Motor - Private",
    "Motor - Commercial",
    "Motor - PSV / Matatu",
  ]),
  insurerId: z.string().uuid().optional().nullable(),
  sumInsured: z.number().positive(),
  basicRate: z.number().positive(),
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

    const { insuranceType, insurerId, sumInsured, basicRate, benefits } =
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
      if (insuranceType === "Motor - Private")
        minPremium = parseFloat(insurer.minPremiumPrivate || "0");
      else if (insuranceType === "Motor - Commercial")
        minPremium = parseFloat(insurer.minPremiumCommercial || "0");
      else if (insuranceType === "Motor - PSV / Matatu")
        minPremium = parseFloat(insurer.minPremiumPsv || "0");
    }

    // Calculate
    const calculatedBasicPremium = (sumInsured * basicRate) / 100;
    const basicPremium = Math.max(calculatedBasicPremium, minPremium);
    const minimumApplied = calculatedBasicPremium < minPremium && minPremium > 0;

    const iraLevy = basicPremium * 0.0045;
    const trainingLevy = basicPremium * 0.002;
    const stampDuty = 40;
    const phcf = 100;

    const totalBenefits = benefits.reduce((s, b) => s + b.amountKes, 0);
    const grandTotal =
      basicPremium + totalBenefits + iraLevy + trainingLevy + stampDuty + phcf;

    // Agency commission (for display only)
    const commissionRate = parseFloat(insurer?.commissionRate || "0");
    const agencyCommission = (grandTotal * commissionRate) / 100;

    return NextResponse.json({
      sumInsured,
      basicRate,
      calculatedBasicPremium: parseFloat(calculatedBasicPremium.toFixed(2)),
      basicPremium: parseFloat(basicPremium.toFixed(2)),
      minimumApplied,
      minPremium: minimumApplied ? minPremium : null,
      iraLevy: parseFloat(iraLevy.toFixed(2)),
      trainingLevy: parseFloat(trainingLevy.toFixed(2)),
      stampDuty,
      phcf,
      totalBenefits: parseFloat(totalBenefits.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2)),
      agencyCommission: parseFloat(agencyCommission.toFixed(2)),
      commissionRate,
      benefits,
      insurer: insurer
        ? { id: insurer.id, name: insurer.name }
        : null,
    });
  } catch (error) {
    console.error("POST /api/calculator/premium error:", error);
    return NextResponse.json(
      { error: "Calculation failed" },
      { status: 500 }
    );
  }
}