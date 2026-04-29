import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customerDocuments } from "@/drizzle/schema";
import { sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const docs = await db
      .select()
      .from(customerDocuments)
      .where(sql`${customerDocuments.blobKey} IS NOT NULL`)
      .limit(1);

    if (docs.length === 0) {
      return NextResponse.json({ message: "No documents found" });
    }

    const doc = docs[0];
    return NextResponse.json({
      id: doc.id,
      blobKey: doc.blobKey,
      fileUrl: doc.fileUrl,
      fileUrlLength: doc.fileUrl?.length,
      fileUrlContainsAuth: doc.fileUrl?.includes("auth") || doc.fileUrl?.includes("_a="),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
