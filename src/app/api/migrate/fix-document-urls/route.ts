// src/app/api/migrate/fix-document-urls/route.ts
// Migration endpoint to regenerate public URLs for existing Cloudinary documents
// This fixes the 401 errors caused by old authenticated URLs
// 
// Call this once: POST /api/migrate/fix-document-urls
// It will iterate through all documents and regenerate their URLs using the public URL format

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customerDocuments, policyDocuments } from "@/drizzle/schema";
import { getPdfUrl } from "@/lib/cloudinary";
import { sql } from "drizzle-orm";

/**
 * POST /api/migrate/fix-document-urls
 * 
 * Iterates through all customer and policy documents in the database.
 * For documents that have a blobKey (Cloudinary public_id), regenerates
 * the fileUrl using the public (non-authenticated) format.
 * 
 * This ensures all existing PDFs use the public URL format instead of
 * authenticated signed URLs that cause 401 errors.
 */
export async function POST(req: NextRequest) {
  try {
    let customerCount = 0;
    let policyCount = 0;
    const errors: string[] = [];

    // ── Fix Customer Documents ──

    const customerDocs = await db
      .select()
      .from(customerDocuments)
      .where(sql`${customerDocuments.blobKey} IS NOT NULL`);

    for (const doc of customerDocs) {
      try {
        if (doc.blobKey) {
          const publicUrl = getPdfUrl(doc.blobKey);
          await db
            .update(customerDocuments)
            .set({
              fileUrl: publicUrl,
              updatedAt: new Date(),
            })
            .where(sql`${customerDocuments.id} = ${doc.id}`);
          customerCount++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Customer doc ${doc.id}: ${msg}`);
      }
    }

    // ── Fix Policy Documents ──

    const policyDocs = await db
      .select()
      .from(policyDocuments)
      .where(sql`${policyDocuments.blobKey} IS NOT NULL`);

    for (const doc of policyDocs) {
      try {
        if (doc.blobKey) {
          const publicUrl = getPdfUrl(doc.blobKey);
          await db
            .update(policyDocuments)
            .set({
              fileUrl: publicUrl,
              updatedAt: new Date(),
            })
            .where(sql`${policyDocuments.id} = ${doc.id}`);
          policyCount++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Policy doc ${doc.id}: ${msg}`);
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        customerDocumentsFixed: customerCount,
        policyDocumentsFixed: policyCount,
        totalFixed: customerCount + policyCount,
        errors: errors.length > 0 ? errors : null,
      },
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Migration failed",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/migrate/fix-document-urls
 * Returns the current status/count of documents that need fixing
 */
export async function GET(req: NextRequest) {
  try {
    const customerDocs = await db
      .select()
      .from(customerDocuments)
      .where(sql`${customerDocuments.blobKey} IS NOT NULL`);

    const policyDocs = await db
      .select()
      .from(policyDocuments)
      .where(sql`${policyDocuments.blobKey} IS NOT NULL`);

    const needsFixing = {
      customerDocuments: customerDocs.filter((d) =>
        d.fileUrl?.includes("authenticated")
      ).length,
      policyDocuments: policyDocs.filter((d) =>
        d.fileUrl?.includes("authenticated")
      ).length,
    };

    return NextResponse.json({
      status: "ready",
      documentsNeedingFix: needsFixing,
      totalDocuments: {
        customerDocuments: customerDocs.length,
        policyDocuments: policyDocs.length,
      },
      instructions: "POST to this endpoint to run the migration",
    });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Status check failed",
      },
      { status: 500 }
    );
  }
}
