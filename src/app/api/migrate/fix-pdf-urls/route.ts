import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customerDocuments } from "@/drizzle/schema";
import { sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    // Get all customer documents with file URLs that contain the problematic pattern
    const docs = await db
      .select()
      .from(customerDocuments)
      .where(sql`${customerDocuments.fileUrl} IS NOT NULL AND ${customerDocuments.fileUrl} LIKE '%/raw/upload/v1/%'`);

    let fixedCount = 0;
    const sampleUrls: string[] = [];

    for (const doc of docs) {
      if (doc.fileUrl) {
        // Fix the URL by removing the /v1/ version segment
        const fixedUrl = doc.fileUrl.replace(/\/raw\/upload\/v1\//, "/raw/upload/");
        
        if (fixedUrl !== doc.fileUrl) {
          await db
            .update(customerDocuments)
            .set({
              fileUrl: fixedUrl,
              updatedAt: new Date(),
            })
            .where(sql`${customerDocuments.id} = ${doc.id}`);
          
          console.log(`[Migration] Fixed PDF URL for doc ${doc.id}: ${doc.fileUrl} → ${fixedUrl}`);
          fixedCount++;
          
          if (sampleUrls.length < 3) {
            sampleUrls.push(`Before: ${doc.fileUrl}\nAfter:  ${fixedUrl}`);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      fixedCount,
      totalChecked: docs.length,
      sampleTransformations: sampleUrls,
      message: `Fixed ${fixedCount} PDF URLs with incorrect version format`,
    });
  } catch (error) {
    console.error("[Migration] Error fixing PDF URLs:", error);
    return NextResponse.json(
      { error: "Failed to fix PDF URLs", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check how many PDF URLs need fixing
    const problematicDocs = await db
      .select()
      .from(customerDocuments)
      .where(sql`${customerDocuments.fileUrl} IS NOT NULL AND ${customerDocuments.fileUrl} LIKE '%/raw/upload/v1/%'`);

    return NextResponse.json({
      status: "ready",
      needsFixing: problematicDocs.length,
      sampleUrls: problematicDocs.slice(0, 3).map(doc => doc.fileUrl),
      instructions: "POST to this endpoint to run the migration and fix PDF URLs",
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
