import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { payments } from "@/drizzle/schema";

export async function GET(req: NextRequest) {
  try {
    const allPayments = await db.select().from(payments);
    return NextResponse.json({ payments: allPayments });
  } catch (error) {
    console.error("GET /api/payments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
