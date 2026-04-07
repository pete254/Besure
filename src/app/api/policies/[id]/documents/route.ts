// src/app/api/policies/[id]/documents/route.ts
// Upload policy documents (logbook, valuation) to Cloudinary

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { policyDocuments, vehicles, policies } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { uploadToCloudinary, deleteFromCloudinary, type CloudinaryFolder } from "@/lib/cloudinary";

const DOC_FOLDER_MAP: Record<string, CloudinaryFolder> = {
  LOGBOOK: "besure/policies/logbooks",
  VALUATION: "besure/policies/valuations",
  PROPOSAL: "besure/policies/valuations",
  PREVIOUS_POLICY: "besure/policies/valuations",
  OTHER: "besure/policies/valuations",
};

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

    const formData = await req.formData();
    const docType = formData.get("docType") as string;
    const docLabel = formData.get("docLabel") as string | null;
    const status = (formData.get("status") as string) || "Received";
    const file = formData.get("file") as File | null;

    if (!docType) {
      return NextResponse.json({ error: "docType is required" }, { status: 400 });
    }

    let fileUrl: string | null = null;
    let publicId: string | null = null;

    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const folder = DOC_FOLDER_MAP[docType] || "besure/policies/valuations";
      const filename = `policy_${id}_${docType}_${Date.now()}`;

      const result = await uploadToCloudinary(buffer, folder, filename);
      fileUrl = result.secureUrl;
      publicId = result.publicId;

      // If it's a logbook, also update the vehicle record's logbook fields
      if (docType === "LOGBOOK") {
        await db
          .update(vehicles)
          .set({ logbookUrl: fileUrl, logbookBlobKey: publicId, updatedAt: new Date() })
          .where(eq(vehicles.policyId, id));
      }
    }

    // Find existing doc of same type for this policy
    const allDocs = await db
      .select()
      .from(policyDocuments)
      .where(eq(policyDocuments.policyId, id));

    const sameType = allDocs.find((d) => d.docType === (docType as any));

    if (sameType) {
      if (sameType.blobKey && fileUrl) {
        try {
          await deleteFromCloudinary(sameType.blobKey);
        } catch {
          // Non-fatal
        }
      }

      const [updated] = await db
        .update(policyDocuments)
        .set({
          fileUrl: fileUrl || sameType.fileUrl,
          blobKey: publicId || sameType.blobKey,
          status: status as any,
          docLabel: docLabel || sameType.docLabel,
          receivedDate: new Date().toISOString().split("T")[0],
          updatedAt: new Date(),
        })
        .where(eq(policyDocuments.id, sameType.id))
        .returning();

      return NextResponse.json({ document: updated });
    }

    const [newDoc] = await db
      .insert(policyDocuments)
      .values({
        policyId: id,
        docType: docType as any,
        docLabel,
        status: status as any,
        fileUrl,
        blobKey: publicId,
        receivedDate: fileUrl ? new Date().toISOString().split("T")[0] : null,
      })
      .returning();

    return NextResponse.json({ document: newDoc }, { status: 201 });
  } catch (error) {
    console.error("POST /api/policies/[id]/documents error:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
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