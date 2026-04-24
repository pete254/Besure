// src/app/api/customers/[id]/documents/route.ts
// Handles customer document uploads to Cloudinary; stores URL in Neon DB

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customerDocuments, customers } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { uploadToCloudinary, deleteFromCloudinary, type CloudinaryFolder } from "@/lib/cloudinary";

const DOC_FOLDER_MAP: Record<string, CloudinaryFolder> = {
  ID: "myloe/customers/id",
  PASSPORT: "myloe/customers/passport",
  KRA: "myloe/customers/kra",
  OTHER: "myloe/customers/company-docs",
};

// POST /api/customers/[id]/documents
// Body: multipart/form-data with fields: docType, docLabel (optional), file
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify customer exists
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

    // Upload file to Cloudinary if provided
    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const folder = DOC_FOLDER_MAP[docType] || "myloe/customers/company-docs";
      const filename = `${id}_${docType}_${Date.now()}`;

      const result = await uploadToCloudinary(buffer, folder, filename);
      fileUrl = result.secureUrl;
      publicId = result.publicId;
    }

    // Check if a document of this type already exists for this customer
    const [existing] = await db
      .select()
      .from(customerDocuments)
      .where(eq(customerDocuments.customerId, id));

    // Upsert: if same docType exists, update it; otherwise insert
    const existingOfType = existing
      ? await db
          .select()
          .from(customerDocuments)
          .where(eq(customerDocuments.customerId, id))
      : [];

    const sameType = existingOfType.find((d) => d.docType === (docType as any));

    if (sameType) {
      // Delete old Cloudinary file if replacing
      if (sameType.blobKey && fileUrl) {
        try {
          await deleteFromCloudinary(sameType.blobKey);
        } catch {
          // Non-fatal — old file cleanup
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