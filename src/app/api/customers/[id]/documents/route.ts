// src/app/api/customers/[id]/documents/route.ts
// Handles customer document uploads to Cloudinary; stores URL in Neon DB

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customerDocuments, customers } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  getPdfUrl,
  type CloudinaryFolder,
} from "@/lib/cloudinary";

const DOC_FOLDER_MAP: Record<string, CloudinaryFolder> = {
  ID: "myloe/customers/id",
  PASSPORT: "myloe/customers/passport",
  KRA: "myloe/customers/kra",
  OTHER: "myloe/customers/company-docs",
};

// POST /api/customers/[id]/documents
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.id, id));

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const docType = formData.get("docType") as string;
    const docLabel = formData.get("docLabel") as string | null;
    const docValue = formData.get("docValue") as string | null;
    const file = formData.get("file") as File | null;

    if (!docType) {
      return NextResponse.json({ error: "docType is required" }, { status: 400 });
    }

    let fileUrl: string | null = null;
    let publicId: string | null = null;

    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const folder = DOC_FOLDER_MAP[docType] || "myloe/customers/company-docs";
      const filename = `${id}_${docType}_${Date.now()}`;

      const result = await uploadToCloudinary(buffer, folder, filename);
      publicId = result.publicId;

      // Use getPdfUrl for PDFs (raw delivery, no image transforms)
      // Use secureUrl directly for images — Cloudinary already returns the correct URL
      const isPdf =
        file.type === "application/pdf" ||
        file.name?.toLowerCase().endsWith(".pdf");

      fileUrl = isPdf ? getPdfUrl(publicId) : result.secureUrl;
    }

    // Find all existing docs for this customer to check for same type
    const existingDocs = await db
      .select()
      .from(customerDocuments)
      .where(eq(customerDocuments.customerId, id));

    const sameType = existingDocs.find((d) => d.docType === (docType as any));

    if (sameType) {
      // Delete old Cloudinary file if we're replacing it
      if (sameType.blobKey && fileUrl) {
        try {
          await deleteFromCloudinary(sameType.blobKey);
        } catch {
          // Non-fatal — old file cleanup best-effort
        }
      }

      const [updated] = await db
        .update(customerDocuments)
        .set({
          fileUrl: fileUrl || sameType.fileUrl,
          blobKey: publicId || sameType.blobKey,
          docValue: docValue || sameType.docValue,
          docLabel: docLabel || sameType.docLabel,
          status: "Uploaded",
          uploadedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(customerDocuments.id, sameType.id))
        .returning();

      return NextResponse.json({ document: updated });
    }

    // Insert new document record
    const [newDoc] = await db
      .insert(customerDocuments)
      .values({
        customerId: id,
        docType: docType as any,
        fileUrl,
        blobKey: publicId,
        docValue,
        docLabel,
        status: fileUrl ? "Uploaded" : "Pending",
        uploadedAt: fileUrl ? new Date() : null,
      })
      .returning();

    return NextResponse.json({ document: newDoc }, { status: 201 });
  } catch (error) {
    console.error("POST /api/customers/[id]/documents error:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}

// GET /api/customers/[id]/documents
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const docs = await db
      .select()
      .from(customerDocuments)
      .where(eq(customerDocuments.customerId, id));

    return NextResponse.json({ documents: docs });
  } catch (error) {
    console.error("GET /api/customers/[id]/documents error:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}