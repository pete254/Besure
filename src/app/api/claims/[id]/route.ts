// src/app/api/claims/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  claims,
  policies,
  customers,
  vehicles,
  claimDocuments,
  followupNotes,
  garages,
  users,
} from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateClaimSchema = z.object({
  // Removed "Executed"; added "Approved" and "Declined"
  stage: z
    .enum([
      "Reported",
      "Documents Pending",
      "Fully Documented",
      "Assessed",
      "Approved",
      "Declined",
      "Released / Settled",
    ])
    .optional(),
  garageId: z.string().uuid().optional().nullable(),
  garageFreeText: z.string().optional().nullable(),
  repairEstimate: z.string().optional().nullable(),
  approvedAmount: z.string().optional().nullable(),
  settlementDate: z.string().optional().nullable(),
  settlementMethod: z.string().optional().nullable(),
});

// GET /api/claims/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [claimData] = await db
      .select({
        claim: claims,
        policy: policies,
        customer: customers,
        vehicle: vehicles,
        garage: garages,
        createdByUser: users,
      })
      .from(claims)
      .leftJoin(policies, eq(claims.policyId, policies.id))
      .leftJoin(customers, eq(policies.customerId, customers.id))
      .leftJoin(vehicles, eq(vehicles.policyId, policies.id))
      .leftJoin(garages, eq(claims.garageId, garages.id))
      .leftJoin(users, eq(claims.createdBy, users.id))
      .where(eq(claims.id, id));

    if (!claimData) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    const docs = await db
      .select()
      .from(claimDocuments)
      .where(eq(claimDocuments.claimId, id));

    const notesData = await db
      .select({ note: followupNotes, staff: users })
      .from(followupNotes)
      .leftJoin(users, eq(followupNotes.staffId, users.id))
      .where(eq(followupNotes.claimId, id));

    const formattedNotes = notesData.map((n) => ({
      id: n.note.id,
      notes: n.note.notes,
      channel: n.note.channel || null,
      noteDate: n.note.noteDate,
      nextFollowupDate: n.note.nextFollowupDate || null,
      staff: n.staff ? { id: n.staff.id, name: n.staff.name } : null,
    }));

    return NextResponse.json({
      claim: claimData.claim,
      policy: claimData.policy,
      customer: claimData.customer,
      vehicle: claimData.vehicle,
      garage: claimData.garage,
      documents: docs,
      notes: formattedNotes,
    });
  } catch (error) {
    console.error("GET /api/claims/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch claim" },
      { status: 500 }
    );
  }
}

// PUT /api/claims/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateClaimSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (data.stage !== undefined) updateData.stage = data.stage;
    if (data.garageId !== undefined) updateData.garageId = data.garageId;
    if (data.garageFreeText !== undefined)
      updateData.garageFreeText = data.garageFreeText;
    if (data.repairEstimate !== undefined)
      updateData.repairEstimate = data.repairEstimate
        ? parseFloat(data.repairEstimate)
        : null;
    if (data.approvedAmount !== undefined)
      updateData.approvedAmount = data.approvedAmount
        ? parseFloat(data.approvedAmount)
        : null;
    if (data.settlementDate !== undefined)
      updateData.settlementDate = data.settlementDate;
    if (data.settlementMethod !== undefined)
      updateData.settlementMethod = data.settlementMethod;

    const [updated] = await db
      .update(claims)
      .set(updateData)
      .where(eq(claims.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    return NextResponse.json({ claim: updated });
  } catch (error) {
    console.error("PUT /api/claims/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update claim" },
      { status: 500 }
    );
  }
}

// DELETE /api/claims/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [deleted] = await db
      .delete(claims)
      .where(eq(claims.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/claims/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete claim" }, { status: 500 });
  }
}