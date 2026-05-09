// src/app/api/calendar/debug/route.ts
// TEMPORARY debug endpoint — remove after fixing
// Visit: /api/calendar/debug to see what's wrong

import { NextResponse } from "next/server";
import { JWT } from "google-auth-library";
import { google } from "googleapis";

export async function GET() {
  const results: Record<string, any> = {};

  // 1. Check env vars exist
  results.hasEmail = !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  results.hasKey = !!process.env.GOOGLE_PRIVATE_KEY;
  results.hasCalendarId = !!process.env.GOOGLE_CALENDAR_ID;
  results.calendarId = process.env.GOOGLE_CALENDAR_ID || "(not set — will use 'primary')";
  results.email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "(missing)";

  // 2. Check key format
  const rawKey = process.env.GOOGLE_PRIVATE_KEY || "";
  const processedKey = rawKey.replace(/\\n/g, "\n");
  results.keyStartsCorrectly = processedKey.includes("-----BEGIN PRIVATE KEY-----");
  results.keyEndsCorrectly = processedKey.includes("-----END PRIVATE KEY-----");
  results.rawKeyLength = rawKey.length;
  results.processedKeyLength = processedKey.length;
  results.rawKeyFirst50 = rawKey.slice(0, 50);

  // 3. Try to create JWT auth
  try {
    const auth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: processedKey,
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });
    results.jwtCreated = true;

    // 4. Try to get an access token (actual auth test)
    try {
      const token = await auth.getAccessToken();
      results.tokenObtained = !!token.token;
      results.tokenPreview = token.token?.slice(0, 20) + "...";
    } catch (tokenErr: any) {
      results.tokenError = tokenErr.message;
      results.tokenErrorDetails = tokenErr.toString();
    }
  } catch (jwtErr: any) {
    results.jwtCreated = false;
    results.jwtError = jwtErr.message;
  }

  // 5. Try listing calendar events (full end-to-end test)
  if (results.tokenObtained) {
    try {
      const auth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: processedKey,
        scopes: ["https://www.googleapis.com/auth/calendar"],
      });
      const cal = google.calendar({ version: "v3", auth });
      const calId = process.env.GOOGLE_CALENDAR_ID || "primary";

      const { data } = await cal.events.list({
        calendarId: calId,
        maxResults: 1,
        timeMin: new Date().toISOString(),
      });
      results.calendarListSuccess = true;
      results.eventCount = data.items?.length ?? 0;
    } catch (calErr: any) {
      results.calendarListSuccess = false;
      results.calendarError = calErr.message;
      // Common errors:
      // "Not Found" → wrong calendar ID
      // "forbidden" → service account not shared on the calendar
      // "invalid_grant" → bad key or clock skew
    }
  }

  // 6. Diagnosis
  const issues: string[] = [];
  if (!results.hasEmail) issues.push("❌ GOOGLE_SERVICE_ACCOUNT_EMAIL is missing");
  if (!results.hasKey) issues.push("❌ GOOGLE_PRIVATE_KEY is missing");
  if (!results.keyStartsCorrectly) issues.push("❌ Private key missing '-----BEGIN PRIVATE KEY-----' header — check newline escaping");
  if (!results.keyEndsCorrectly) issues.push("❌ Private key missing '-----END PRIVATE KEY-----' footer");
  if (results.tokenError?.includes("invalid_grant")) issues.push("❌ invalid_grant: key is malformed or system clock is off");
  if (results.calendarError?.includes("Not Found")) issues.push(`❌ Calendar '${results.calendarId}' not found — wrong GOOGLE_CALENDAR_ID`);
  if (results.calendarError?.includes("forbidden") || results.calendarError?.includes("403")) {
    issues.push(`❌ Permission denied — share your Google Calendar with: ${results.email}`);
  }
  if (issues.length === 0 && results.calendarListSuccess) issues.push("✅ Everything looks good!");
  if (issues.length === 0 && !results.calendarListSuccess) issues.push("⚠️ Auth worked but calendar test failed");

  results.diagnosis = issues;

  return NextResponse.json(results, { status: 200 });
}
