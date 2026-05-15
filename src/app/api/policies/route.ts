// src/app/api/policies/route.ts
// Updated: new insurance types including Motor - Private Comp and commercial variants

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { policies, customers, vehicles, insurers, policyBenefits, payments, policyDocuments } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { calculateAndStoreCommission } from "@/lib/commission";

const createPolicySchema = z.object({
  insuranceType: z.enum([
    "Motor - Private",
    "Motor - Private Comp",
    "Motor - Commercial",
    "Motor - PSV / Matatu",
    "Motor - Commercial Institutional",
    "Motor - Commercial TSV",
    "Motor - Commercial Third Party",
    "Fire & Perils",
    "Domestic Package",
    "Medical / Health",
    "Life Insurance",
    "Travel Insurance",
  ], { message: "Please select a valid insurance type" }),
  customerId: z.string().uuid("Please select a valid customer"),
  insurerId: z.string().uuid().optional().nullable(),
  insurerNameManual: z.string().optional().nullable(),
  vehicle: z.object({
    make: z.string().optional().nullable(),
    model: z.string().optional().nullable(),
    year: z.number().int().min(1900).optional().nullable(),
    cc: z.number().optional().nullable(),
    tonnage: z.string().optional().nullable(),
    seats: z.number().optional().nullable(),
    chassisNo: z.string().optional().nullable(),
    engineNo: z.string().optional().nullable(),
    regNo: z.string().optional().nullable(),
    bodyType: z.string().optional().nullable(),
    colour: z.string().optional().nullable(),
  }).optional().nullable(),
  coverType: z.enum(["Comprehensive", "TPO", "TPFT", "medical"]).optional().nullable(),
  sumInsured: z.string().optional().nullable(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  policyNumber: z.string().optional().nullable(),
  basicRate: z.string().optional().nullable(),
  basicPremium: z.string().optional().nullable(),
  iraLevy: z.string().optional().nullable(),
  trainingLevy: z.string().optional().nullable(),
  stampDuty: z.string().default("40"),
  phcf: z.string().default("0"),
  benefits: z.array(z.object({
    benefitOptionId: z.string().optional().nullable(),
    benefitName: z.string(),
    amountKes: z.string(),
  })).default([]),
  totalBenefits: z.string().default("0"),
  grandTotal: z.string().optional().nullable(),
  paymentMode: z.enum(["Full Payment", "2 Installments", "3 Installments", "IPF"], { message: "Please select a valid payment mode" }),
  ipfProvider: z.string().optional().nullable(),
  ipfLoanReference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  medicalMeta: z.object({
    inpatientLimit: z.string().optional().nullable(),
    outpatientLimit: z.string().optional().nullable(),
    principalCount: z.number().int().min(1).optional().nullable(),
    dependantCount: z.number().int().min(0).optional().nullable(),
    hasWaitingPeriod: z.boolean().optional().nullable(),
    waitingPeriodDays: z.number().int().optional().nullable(),
    maternityEnabled: z.boolean().optional().nullable(),
    dentalEnabled: z.boolean().optional().nullable(),
    opticalEnabled: z.boolean().optional().nullable(),
  }).optional().nullable(),
  documents: z.array(z.object({
    docType: z.string(),
    fileUrl: z.string(),
    blobKey: z.string(),
    docLabel: z.string(),
  })).default([]),
}).superRefine((data, ctx) => {
  const isMedical = data.insuranceType === "Medical / Health";
  const isMotor = MOTOR_TYPES.includes(data.insuranceType);
  
  // Vehicle validation ONLY for motor types
  if (isMotor && data.vehicle) {
    if (!data.vehicle.make) {
      ctx.addIssue({ 
        code: z.ZodIssueCode.custom, 
        message: "Make is required", 
        path: ["vehicle", "make"] 
      });
    }
    if (!data.vehicle.regNo) {
      ctx.addIssue({ 
        code: z.ZodIssueCode.custom, 
        message: "Reg No is required", 
        path: ["vehicle", "regNo"] 
      });
    }
    if (!data.vehicle.chassisNo) {
      ctx.addIssue({ 
        code: z.ZodIssueCode.custom, 
        message: "Chassis No is required", 
        path: ["vehicle", "chassisNo"] 
      });
    }
    if (!data.vehicle.engineNo) {
      ctx.addIssue({ 
        code: z.ZodIssueCode.custom, 
        message: "Engine No is required", 
        path: ["vehicle", "engineNo"] 
      });
    }
  }
  
  // Medical validation ONLY for medical types
  if (isMedical) {
    if (!data.medicalMeta?.inpatientLimit || parseFloat(data.medicalMeta.inpatientLimit as string) <= 0) {
      ctx.addIssue({ 
        code: z.ZodIssueCode.custom, 
        message: "Inpatient limit is required and must be greater than 0", 
        path: ["medicalMeta", "inpatientLimit"] 
      });
    }
    if (!data.basicPremium || parseFloat(data.basicPremium as string) <= 0) {
      ctx.addIssue({ 
        code: z.ZodIssueCode.custom, 
        message: "Net premium is required for medical policies", 
        path: ["basicPremium"] 
      });
    }
  }
});

// Which insurance types count as "motor"
const MOTOR_TYPES = [
  "Motor - Private",
  "Motor - Private Comp",
  "Motor - Commercial",
  "Motor - PSV / Matatu",
  "Motor - Commercial Institutional",
  "Motor - Commercial TSV",
  "Motor - Commercial Third Party",
];

// GET /api/policies
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const results = await db
      .select({
        policy: policies,
        customer: {
          id: customers.id,
          firstName: customers.firstName,
          lastName: customers.lastName,
          companyName: customers.companyName,
          customerType: customers.customerType,
          phone: customers.phone,
        },
        insurer: {
          id: insurers.id,
          name: insurers.name,
        },
      })
      .from(policies)
      .leftJoin(customers, eq(policies.customerId, customers.id))
      .leftJoin(insurers, eq(policies.insurerId, insurers.id))
      .orderBy(desc(policies.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ policies: results, page, limit });
  } catch (error) {
    console.error("GET /api/policies error:", error);
    return NextResponse.json({ error: "Failed to fetch policies" }, { status: 500 });
  }
}

// POST /api/policies
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("POST /api/policies - Request body:", JSON.stringify(body, null, 2));
    
    const parsed = createPolicySchema.safeParse(body);

    if (!parsed.success) {
      console.error("Validation failed - Issues:", JSON.stringify(parsed.error.issues, null, 2));
      console.error("Validation failed - Error details:", parsed.error.message);
      
      return NextResponse.json(
        { 
          error: "Validation failed", 
          issues: parsed.error.issues,
          details: parsed.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
            code: issue.code,
          }))
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const isMotor = MOTOR_TYPES.includes(data.insuranceType);

    // Create policy
    const [newPolicy] = await db.insert(policies).values({
      customerId: data.customerId,
      insurerId: data.insurerId || null,
      insurerNameManual: data.insurerNameManual || null,
      insuranceType: data.insuranceType,
      coverType: data.coverType || null,
      policyNumber: data.policyNumber || null,
      startDate: data.startDate,
      endDate: data.endDate,
      sumInsured: data.insuranceType === "Medical / Health"
        ? (data.medicalMeta?.inpatientLimit || data.sumInsured || null)
        : (data.sumInsured || null),
      basicRate: data.basicRate || null,
      basicPremium: data.basicPremium || null,
      iraLevy: data.iraLevy || null,
      trainingLevy: data.trainingLevy || null,
      stampDuty: data.stampDuty,
      phcf: data.phcf,
      totalBenefits: data.totalBenefits,
      grandTotal: data.grandTotal || null,
      paymentMode: data.paymentMode,
      ipfProvider: data.ipfProvider || null,
      ipfLoanReference: data.ipfLoanReference || null,
      certificateExpiryDate: data.endDate,
      certificateExpiryReason: null,
      notes: data.notes || null,
      medicalMeta: data.medicalMeta || null,
      status: "Active",
    }).returning();

    // Create vehicle record if motor
    if (isMotor && data.vehicle) {
      const vehicleData = {
        policyId: newPolicy.id,
        make: data.vehicle.make || "",
        model: data.vehicle.model || "",
        year: data.vehicle.year || new Date().getFullYear(),
        cc: data.vehicle.cc || null,
        tonnage: data.vehicle.tonnage || null,
        seats: data.vehicle.seats || null,
        chassisNo: data.vehicle.chassisNo || "",
        engineNo: data.vehicle.engineNo || "",
        regNo: data.vehicle.regNo || "",
        bodyType: data.vehicle.bodyType || null,
        colour: data.vehicle.colour || null,
      };
      await db.insert(vehicles).values(vehicleData as any);
    }

    // Create policy benefits
    if (data.benefits.length > 0) {
      await db.insert(policyBenefits).values(
        data.benefits.map((b) => ({
          policyId: newPolicy.id,
          benefitOptionId: b.benefitOptionId || null,
          benefitName: b.benefitName,
          amountKes: b.amountKes,
        }))
      );
    }

    // Create payment schedule
    const total = parseFloat(data.grandTotal || "0");
    if (data.paymentMode === "Full Payment") {
      await db.insert(payments).values({
        policyId: newPolicy.id,
        installmentNumber: 1,
        totalInstallments: 1,
        amountDue: data.grandTotal || "0",
        dueDate: data.startDate,
        status: "pending",
      });
    } else if (data.paymentMode === "2 Installments") {
      const half = (total / 2).toFixed(2);
      const date2 = new Date(data.startDate);
      date2.setDate(date2.getDate() + 30);
      await db.insert(payments).values([
        { policyId: newPolicy.id, installmentNumber: 1, totalInstallments: 2, amountDue: half, dueDate: data.startDate, status: "pending" },
        { policyId: newPolicy.id, installmentNumber: 2, totalInstallments: 2, amountDue: half, dueDate: date2.toISOString().split("T")[0], status: "pending" },
      ]);
    } else if (data.paymentMode === "3 Installments") {
      const third1 = (total / 3).toFixed(2);
      const third2 = (total / 3).toFixed(2);
      const third3 = (total - parseFloat(third1) - parseFloat(third2)).toFixed(2);
      const date2 = new Date(data.startDate); date2.setDate(date2.getDate() + 30);
      const date3 = new Date(data.startDate); date3.setDate(date3.getDate() + 60);
      await db.insert(payments).values([
        { policyId: newPolicy.id, installmentNumber: 1, totalInstallments: 3, amountDue: third1, dueDate: data.startDate, status: "pending" },
        { policyId: newPolicy.id, installmentNumber: 2, totalInstallments: 3, amountDue: third2, dueDate: date2.toISOString().split("T")[0], status: "pending" },
        { policyId: newPolicy.id, installmentNumber: 3, totalInstallments: 3, amountDue: third3, dueDate: date3.toISOString().split("T")[0], status: "pending" },
      ]);
    }

    // Create policy documents
    if (data.documents.length > 0) {
      await db.insert(policyDocuments).values(
        data.documents.map((doc) => ({
          policyId: newPolicy.id,
          docType: doc.docType as any,
          docLabel: doc.docLabel,
          status: "Received" as any,
          fileUrl: doc.fileUrl,
          blobKey: doc.blobKey,
        }))
      );
    }

    // Generate commission if policy has an insurer with a commission rate
    try {
      if (data.insurerId) {
        const insurer = await db
          .select({ commissionRate: insurers.commissionRate })
          .from(insurers)
          .where(eq(insurers.id, data.insurerId))
          .then((r) => r[0]);

        if (insurer?.commissionRate) {
          await calculateAndStoreCommission(newPolicy.id);
        }
      }
    } catch (commissionError) {
      // Log commission generation error but don't fail policy creation
      console.warn("Failed to generate commission for policy:", newPolicy.id, commissionError);
    }

    return NextResponse.json({ policy: newPolicy }, { status: 201 });
  } catch (error) {
    console.error("POST /api/policies error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: "Failed to create policy",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}