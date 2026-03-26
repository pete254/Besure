// src/app/api/customers/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customers } from "@/drizzle/schema";
import { ilike, or, desc } from "drizzle-orm";
import { z } from "zod";

const createCustomerSchema = z.object({
  // Individual fields
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  middleName: z.string().optional().nullable(),
  phone: z.string().min(9, "Valid phone number required"),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  idNumber: z.string().optional().nullable(),
  idNumberValue: z.string().optional().nullable(),
  kraPin: z.string().optional().nullable(),
  kraPinValue: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.enum(["Male", "Female", "Other"]).optional().nullable(),
  county: z.string().optional().nullable(),
  physicalAddress: z.string().optional().nullable(),
  customerType: z.enum(["Individual", "Company"]).default("Individual"),
  // Company fields
  companyName: z.string().optional().nullable(),
  town: z.string().optional().nullable(),
  postalAddress: z.string().optional().nullable(),
  companyEmail: z.string().email().optional().or(z.literal("")).nullable(),
  companyPhone: z.string().optional().nullable(),
  certOfIncorporationValue: z.string().optional().nullable(),
  cr12Value: z.string().optional().nullable(),
  companyKraPinValue: z.string().optional().nullable(),
  directors: z.array(z.object({
    name: z.string(),
    idNumber: z.string().optional(),
    idNumberValue: z.string().optional(),
    kraPin: z.string().optional(),
    kraPinValue: z.string().optional(),
  })).optional().nullable(),
});

// GET /api/customers
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const results = search
      ? await db.select().from(customers)
          .where(or(
            ilike(customers.firstName, `%${search}%`),
            ilike(customers.lastName, `%${search}%`),
            ilike(customers.phone, `%${search}%`),
            ilike(customers.idNumber, `%${search}%`),
            ilike(customers.county, `%${search}%`),
            ilike(customers.companyName, `%${search}%`),
          ))
          .orderBy(desc(customers.createdAt))
          .limit(limit).offset(offset)
      : await db.select().from(customers)
          .orderBy(desc(customers.createdAt))
          .limit(limit).offset(offset);

    return NextResponse.json({ customers: results, page, limit });
  } catch (error) {
    console.error("GET /api/customers error:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

// POST /api/customers
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createCustomerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    }

    const data = parsed.data;

    if (data.customerType === "Company" && !data.companyName) {
      return NextResponse.json({ error: "Company name is required for company customers" }, { status: 400 });
    }

    const [newCustomer] = await db.insert(customers).values({
      firstName: data.firstName,
      lastName: data.lastName,
      middleName: data.middleName || null,
      phone: data.phone,
      email: data.email || null,
      idNumber: data.idNumber || null,
      idNumberValue: data.idNumberValue || null,
      kraPin: data.kraPin || null,
      kraPinValue: data.kraPinValue || null,
      dateOfBirth: data.dateOfBirth || null,
      gender: data.gender || null,
      county: data.county || null,
      physicalAddress: data.physicalAddress || null,
      customerType: data.customerType,
      companyName: data.companyName || null,
      town: data.town || null,
      postalAddress: data.postalAddress || null,
      companyEmail: data.companyEmail || null,
      companyPhone: data.companyPhone || null,
      certOfIncorporationValue: data.certOfIncorporationValue || null,
      cr12Value: data.cr12Value || null,
      companyKraPinValue: data.companyKraPinValue || null,
      directors: data.directors || null,
    }).returning();

    return NextResponse.json({ customer: newCustomer }, { status: 201 });
  } catch (error) {
    console.error("POST /api/customers error:", error);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}