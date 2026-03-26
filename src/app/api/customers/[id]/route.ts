// src/app/api/customers/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customers } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateCustomerSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  middleName: z.string().optional().nullable(),
  phone: z.string().min(9).optional(),
  email: z.string().email().optional().nullable(),
  idNumber: z.string().optional().nullable(),
  idNumberValue: z.string().optional().nullable(),
  kraPin: z.string().optional().nullable(),
  kraPinValue: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.enum(["Male", "Female", "Other"]).optional().nullable(),
  county: z.string().optional().nullable(),
  physicalAddress: z.string().optional().nullable(),
  customerType: z.enum(["Individual", "Company"]).optional(),
  companyName: z.string().optional().nullable(),
  town: z.string().optional().nullable(),
  postalAddress: z.string().optional().nullable(),
  companyEmail: z.string().optional().nullable(),
  companyPhone: z.string().optional().nullable(),
  certOfIncorporationValue: z.string().optional().nullable(),
  cr12Value: z.string().optional().nullable(),
  companyKraPinValue: z.string().optional().nullable(),
  directors: z.any().optional().nullable(),
});

// GET /api/customers/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    return NextResponse.json({ customer });
  } catch (error) {
    console.error("GET /api/customers/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 });
  }
}

// PUT /api/customers/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateCustomerSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });

    const [updated] = await db.update(customers)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();

    if (!updated) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    return NextResponse.json({ customer: updated });
  } catch (error) {
    console.error("PUT /api/customers/[id] error:", error);
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}

// DELETE /api/customers/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [deleted] = await db.delete(customers).where(eq(customers.id, id)).returning();
    if (!deleted) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/customers/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
  }
}