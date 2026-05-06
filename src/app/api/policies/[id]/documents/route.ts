// src/app/api/policies/[id]/documents/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { policyDocuments, policies } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { uploadToCloudinary, deleteFromCloudinary, type CloudinaryFolder } from "@/lib/cloudinary";

const DOC_FOLDER_MAP: Record<string, CloudinaryFolder> = {
  VALUATION:  "myloe/policies/valuations",
  PROPOSAL:   "myloe/policies/valuations",
  LOGBOOK:    "myloe/policies/logbooks",
  OTHER:      "myloe/policies/valuations",
};

// POST /api/policies/[id]/documents — accepts multipart FormData
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

    const formData = await req.formData();
    const docType  = formData.get("docType")  as string;
    const docLabel = formData.get("docLabel") as string | null;
    const status   = formData.get("status")   as string | null;
    const file     = formData.get("file")     as File | null;

    if (!docType) {
      return NextResponse.json({ error: "docType is required" }, { status: 400 });
    }

    let fileUrl: string | null = null;
    let blobKey: string | null = null;

    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer      = Buffer.from(arrayBuffer);
      const folder      = DOC_FOLDER_MAP[docType] || "myloe/policies/valuations";
      const ext         = file.name?.split(".").pop() || "pdf";
      const filename    = `${id}_${docType}_${Date.now()}.${ext}`;

      const result = await uploadToCloudinary(buffer, folder as CloudinaryFolder, filename);
      fileUrl = result.secureUrl;
      blobKey = result.publicId;
    }

    // Upsert: if same docType exists for this policy, replace it
    const existing = await db
      .select()
      .from(policyDocuments)
      .where(eq(policyDocuments.policyId, id));

    const sameType = existing.find(d => d.docType === (docType as any));

    if (sameType) {
      // Delete old file from Cloudinary if replacing
      if (sameType.blobKey && fileUrl) {
        try { await deleteFromCloudinary(sameType.blobKey); } catch {}
      }

      const [updated] = await db
        .update(policyDocuments)
        .set({
          fileUrl:      fileUrl  || sameType.fileUrl,
          blobKey:      blobKey  || sameType.blobKey,
          docLabel:     docLabel || sameType.docLabel,
          status:       (status as any) || sameType.status,
          receivedDate: fileUrl ? new Date().toISOString().split("T")[0] : sameType.receivedDate,
          updatedAt:    new Date(),
        })
        .where(eq(policyDocuments.id, sameType.id))
        .returning();

      return NextResponse.json({ document: updated });
    }

    const [newDoc] = await db
      .insert(policyDocuments)
      .values({
        policyId:     id,
        docType:      docType as any,
        docLabel:     docLabel || docType,
        status:       fileUrl ? "Received" : "Pending",
        fileUrl:      fileUrl,
        blobKey:      blobKey,
        receivedDate: fileUrl ? new Date().toISOString().split("T")[0] : null,
      })
      .returning();

    return NextResponse.json({ document: newDoc }, { status: 201 });
  } catch (error) {
    console.error("POST /api/policies/[id]/documents error:", error);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
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
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}