// src/app/api/claims/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { claims, policies, customers, vehicles } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const createClaimSchema = z.object({
  policyId: z.string().uuid("Please select a valid policy"),
  dateOfLoss: z.string().min(1, "Date of loss is required"),
  dateReported: z.string().min(1, "Date reported is required"),
  natureOfLoss: z.enum(["Accident", "Theft", "Fire", "Flood", "Vandalism", "Other"], { message: "Please select a valid nature of loss" }),
  location: z.string().optional().nullable(),
  thirdPartyInvolved: z.boolean().default(false),
  thirdPartyDetails: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    regNo: z.string().optional(),
    insurer: z.string().optional(),
  }).optional().nullable(),
  policeAbstractNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Generate claim number: CLM-2025-0001
async function generateClaimNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const existing = await db.select().from(claims);
  const count = existing.filter(c => c.claimNumber.includes(String(year))).length;
  const seq = String(count + 1).padStart(4, "0");
  return `CLM-${year}-${seq}`;
}

// GET /api/claims
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const results = await db
      .select({
        claim: claims,
        policy: {
          id: policies.id,
          insuranceType: policies.insuranceType,
          policyNumber: policies.policyNumber,
        },
        customer: {
          id: customers.id,
          firstName: customers.firstName,
          lastName: customers.lastName,
          companyName: customers.companyName,
          customerType: customers.customerType,
        },
        vehicle: {
          make: vehicles.make,
          model: vehicles.model,
          regNo: vehicles.regNo,
        },
      })
      .from(claims)
      .leftJoin(policies, eq(claims.policyId, policies.id))
      .leftJoin(customers, eq(policies.customerId, customers.id))
      .leftJoin(vehicles, eq(vehicles.policyId, policies.id))
      .orderBy(desc(claims.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ claims: results, page, limit });
  } catch (error) {
    console.error("GET /api/claims error:", error);
    return NextResponse.json({ error: "Failed to fetch claims" }, { status: 500 });
  }
}

// POST /api/claims
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createClaimSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const claimNumber = await generateClaimNumber();

    const [newClaim] = await db.insert(claims).values({
      policyId: data.policyId,
      claimNumber,
      dateOfLoss: data.dateOfLoss,
      dateReported: data.dateReported,
      natureOfLoss: data.natureOfLoss,
      location: data.location || null,
      thirdPartyInvolved: data.thirdPartyInvolved,
      thirdPartyDetails: data.thirdPartyDetails || null,
      policeAbstractNumber: data.policeAbstractNumber || null,
      stage: "Reported",
    }).returning();

    return NextResponse.json({ claim: newClaim }, { status: 201 });
  } catch (error) {
    console.error("POST /api/claims error:", error);
    return NextResponse.json({ error: "Failed to create claim" }, { status: 500 });
  }
}