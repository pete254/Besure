// src/app/api/policies/[id]/documents/route.ts
// Upload policy documents using Vercel Blob storage

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { policyDocuments, vehicles, policies } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const createDocumentSchema = z.object({
  docType: z.enum(["LOGBOOK", "VALUATION", "PROPOSAL", "QUOTATION", "PREVIOUS_POLICY", "OTHER"]),
  fileUrl: z.string().url(),
  blobKey: z.string(),
  docLabel: z.string(),
});

// POST /api/policies/[id]/documents
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [policy] = await db
      .select({ id: policies.id })
      .from(policies)
      .where(eq(policies.id, id));

    if (!policy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = createDocumentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Create document record with pre-uploaded file info
    const [document] = await db.insert(policyDocuments).values({
      policyId: id,
      docType: data.docType,
      docLabel: data.docLabel,
      status: "Received",
      fileUrl: data.fileUrl,
      blobKey: data.blobKey,
    }).returning();

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error("POST /api/policies/[id]/documents error:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}

// DELETE /api/policies/[id]/documents/[docId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const docId = url.pathname.split('/').pop();
    
    if (!docId) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    // Find the document
    const [document] = await db
      .select()
      .from(policyDocuments)
      .where(eq(policyDocuments.id, docId));

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Verify the document belongs to the policy
    if (document.policyId !== id) {
      return NextResponse.json({ error: "Document does not belong to this policy" }, { status: 403 });
    }

    // Delete the document record
    await db.delete(policyDocuments).where(eq(policyDocuments.id, docId));

    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/policies/[id]/documents error:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}

// GET /api/policies/[id]/documents
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const docs = await db
      .select()
      .from(policyDocuments)
      .where(eq(policyDocuments.policyId, id));

    return NextResponse.json({ documents: docs });
  } catch (error) {
    console.error("GET /api/policies/[id]/documents error:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}