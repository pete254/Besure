/**
 * POST /api/cron/generate-commissions
 * Generates commission records from policies with insurer rates
 *
 * This endpoint:
 * 1. Finds all active policies with insurers that have commission rates
 * 2. Calculates commission for each: (premium * rate) / 100
 * 3. Creates commission records with expectedDueDate = 30 days after policy start
 * 4. Skips policies that already have commissions
 *
 * Requires: CRON_SECRET header for security
 * Schedule: Run daily or when new policies are activated
 */

import { NextRequest, NextResponse } from "next/server";
import { generateMissingCommissions, regenerateAllCommissions } from "@/lib/commission";

export async function POST(request: NextRequest) {
  try {
    // ─── Verify CRON_SECRET ───────────────────────────────────────────
    const authHeader = request.headers.get("Authorization");
    const providedSecret = authHeader?.replace("Bearer ", "");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || providedSecret !== cronSecret) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid or missing CRON_SECRET" },
        { status: 401 }
      );
    }

    // Get action from query parameter (default: generate-missing)
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "generate-missing";

    let result;

    if (action === "regenerate-all") {
      // Regenerate all commissions (overwrites existing)
      console.log("Regenerating all commissions...");
      result = await regenerateAllCommissions();
    } else {
      // Generate missing commissions only
      console.log("Generating missing commissions...");
      result = await generateMissingCommissions();
    }

    console.log("Commission generation result:", result);

    return NextResponse.json(
      {
        success: true,
        action,
        ...result,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in commission generation cron:", {
      message: errorMessage,
      error,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: `Failed to generate commissions: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
