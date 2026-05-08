// src/app/api/car-sales/calendar/sync/route.ts
// Syncs reminders to Google Calendar

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, carSalesReminders } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { google } from "googleapis";

const calendar = google.calendar("v3");

async function getAccessToken(email: string): Promise<string | null> {
  try {
    // Get user with refresh token
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || !user.googleRefreshToken) {
      console.error("No refresh token found for user");
      return null;
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
    );

    // Set refresh token
    oauth2Client.setCredentials({
      refresh_token: user.googleRefreshToken,
    });

    // Get new access token
    const { credentials } = await oauth2Client.refreshAccessToken();
    const accessToken = credentials.access_token;

    if (!accessToken) {
      console.error("Failed to get access token");
      return null;
    }

    // Store new access token
    await db
      .update(users)
      .set({
        googleAccessToken: accessToken,
        updatedAt: new Date(),
      })
      .where(eq(users.email, email));

    return accessToken;
  } catch (error) {
    console.error("Error getting access token:", error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get valid access token
    const accessToken = await getAccessToken(session.user.email);
    if (!accessToken) {
      return NextResponse.json(
        { error: "Failed to authenticate with Google" },
        { status: 401 }
      );
    }

    // Create OAuth2 client with access token
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ access_token: accessToken });

    // Fetch reminders from your database
    const reminders = await db.query.carSalesReminders.findMany({
      limit: 50,
    });

    let syncedCount = 0;
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

    for (const reminder of reminders) {
      try {
        // Check if already synced
        if (reminder.googleEventId) {
          continue; // Already synced
        }

        // Create Google Calendar event
        const event = {
          summary: reminder.reminderType,
          description: reminder.notes || `Reminder from BeSure Insurance`,
          start: {
            dateTime: new Date(reminder.reminderDate).toISOString(),
            timeZone: "Africa/Nairobi",
          },
          end: {
            dateTime: new Date(
              new Date(reminder.reminderDate).getTime() + 3600000
            ).toISOString(),
            timeZone: "Africa/Nairobi",
          },
          reminders: {
            useDefault: true,
          },
        };

        const response = await calendar.events.insert({
          auth: oauth2Client,
          calendarId,
          requestBody: event as any,
        });

        if (response.data.id) {
          // Update reminder with Google Event ID
          await db
            .update(carSalesReminders)
            .set({
              googleEventId: response.data.id,
              updatedAt: new Date(),
            })
            .where(eq(carSalesReminders.id, reminder.id));

          syncedCount++;
          console.log(
            `✅ Synced reminder "${reminder.reminderType}" to Google Calendar`
          );
        }
      } catch (error) {
        console.error(`❌ Failed to sync reminder ${reminder.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedCount} reminders to Google Calendar`,
      synced: syncedCount,
    });
  } catch (error) {
    console.error("Calendar sync error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });
    return NextResponse.json(
      { 
        error: "Failed to sync calendar",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch events from Google Calendar
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = await getAccessToken(session.user.email);
    if (!accessToken) {
      return NextResponse.json(
        { error: "Failed to authenticate with Google" },
        { status: 401 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

    // Fetch events from Google Calendar
    const response = await calendar.events.list({
      auth: oauth2Client,
      calendarId,
      maxResults: 50,
      orderBy: "startTime",
      singleEvents: true,
      timeMin: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      events: response.data.items || [],
      total: response.data.items?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching Google Calendar events:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 }
    );
  }
}
