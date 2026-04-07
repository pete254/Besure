// src/app/api/customers/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customers } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateCustomerSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  middleName: z.string().optional().nullable(),
  phone: z.string().min(9, "Phone number must be at least 9 digits").optional(),
  email: z.string().regex(/^[^\s@]+@[^\s@]+$/, "Please enter a valid email address").optional().nullable(),
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
  companyEmail: z.string().regex(/^[^\s@]+@[^\s@]+$/, "Please enter a valid company email address").optional().nullable(),
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
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id));
    if (!customer)
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    return NextResponse.json({ customer });
  } catch (error) {
    console.error("GET /api/customers/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
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

    // Strip gender for companies before validation
    const cleanedBody = {
      ...body,
      gender:
        body.customerType === "Company" ? null : body.gender || null,
    };

    const parsed = updateCustomerSchema.safeParse(cleanedBody);
    if (!parsed.success)
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );

    const updateData = {
      ...parsed.data,
      // Ensure gender is always null for companies even if the record existed before the fix
      gender:
        (parsed.data.customerType ?? body.customerType) === "Company"
          ? null
          : parsed.data.gender ?? null,
      // Convert empty strings to null for date fields
      dateOfBirth: parsed.data.dateOfBirth || null,
      updatedAt: new Date(),
    };

    const [updated] = await db
      .update(customers)
      .set(updateData)
      .where(eq(customers.id, id))
      .returning();

    if (!updated)
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    return NextResponse.json({ customer: updated });
  } catch (error) {
    console.error("PUT /api/customers/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [deleted] = await db
      .delete(customers)
      .where(eq(customers.id, id))
      .returning();
    if (!deleted)
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/customers/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}