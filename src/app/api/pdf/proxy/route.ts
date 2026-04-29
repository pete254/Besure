// src/app/api/pdf/proxy/route.ts
// Server-side PDF proxy — fetches PDFs from Cloudinary and streams them to client
// This bypasses CORS and authentication issues entirely

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { policyDocuments, customerDocuments } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import cloudinary from "@/lib/cloudinary";

/**
 * GET /api/pdf/proxy?type=policy&id=<documentId>
 * GET /api/pdf/proxy?type=customer&id=<documentId>
 * 
 * Fetches a PDF by document ID from Cloudinary and streams it directly.
 * This avoids CORS and auth issues since the server fetches it.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "policy" or "customer"
    const docId = searchParams.get("id");

    if (!type || !docId) {
      return NextResponse.json(
        { error: "Missing type or id parameter" },
        { status: 400 }
      );
    }

    // Fetch document from database based on type
    let doc;
    let docLabel = "document";

    if (type === "policy") {
      const result = await db
        .select()
        .from(policyDocuments)
        .where(eq(policyDocuments.id, docId));
      doc = result[0];
      if (doc) docLabel = doc.docLabel || "policy_document";
    } else if (type === "customer") {
      const result = await db
        .select()
        .from(customerDocuments)
        .where(eq(customerDocuments.id, docId));
      doc = result[0];
      if (doc) docLabel = doc.docLabel || doc.docType || "customer_document";
    }

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Extract public_id from blobKey (which stores the Cloudinary public_id)
    const publicId = doc.blobKey;
    if (!publicId) {
      return NextResponse.json(
        { error: "Document has no cloudinary public_id" },
        { status: 400 }
      );
    }

    // Fetch the PDF from Cloudinary
    const pdfUrl = cloudinary.url(publicId, {
      secure: true,
      resource_type: "raw",
      type: "upload",
    });

    // Fetch the actual PDF binary from Cloudinary
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      console.error(`Failed to fetch PDF from Cloudinary: ${pdfResponse.status}`);
      return NextResponse.json(
        { error: "Failed to fetch PDF from Cloudinary" },
        { status: pdfResponse.status }
      );
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

    // Stream the PDF back to the client with proper headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${docLabel}.pdf"`,
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("GET /api/pdf/proxy error:", error);
    return NextResponse.json(
      { error: "Failed to proxy PDF" },
      { status: 500 }
    );
  }
}
