/**
 * GET /api/cron/generate-commissions/trigger
 * Manual trigger endpoint for testing/debugging commission generation
 *
 * This endpoint allows manual invocation of the commission generation cron job
 * without requiring external cron services. Useful for testing and debugging.
 *
 * Query parameters:
 * - action: "generate-missing" (default) or "regenerate-all"
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "generate-missing";

    // Call the main cron endpoint with Bearer token from CRON_SECRET
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json(
        { error: "CRON_SECRET not configured" },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const url = new URL("/api/cron/generate-commissions", baseUrl);
    url.searchParams.set("action", action);

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error triggering commission generation:", errorMessage);

    return NextResponse.json(
      { error: `Failed to trigger commission generation: ${errorMessage}` },
      { status: 500 }
    );
  }
}
