import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { auth as getAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, carSalesReminders } from "@/drizzle/schema";

const calendar = google.calendar("v3");

export async function GET(req: NextRequest) {
  try {
    const session = await getAuth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: "service_account",
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        client_id: process.env.GOOGLE_SERVICE_ACCOUNT_ID,
      },
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    // Get all pending reminders
    const reminders = await db.query.carSalesReminders.findMany({
      where: (reminders, { isNull }) => isNull(reminders.googleEventId),
    });

    if (reminders.length === 0) {
      return NextResponse.json({ message: "No reminders to sync", synced: 0 });
    }

    let syncedCount = 0;

    for (const reminder of reminders) {
      try {
        // Create Google Calendar event
        const event = {
          summary: reminder.reminderType,
          description: reminder.notes || "",
          start: {
            dateTime: new Date(reminder.reminderDate).toISOString(),
            timeZone: "Africa/Nairobi",
          },
          end: {
            dateTime: new Date(
              new Date(reminder.reminderDate).getTime() + 3600000
            ).toISOString(), // 1 hour duration
            timeZone: "Africa/Nairobi",
          },
          reminders: {
            useDefault: true,
          },
        };

        const response = await calendar.events.insert(
          {
            auth,
            calendarId: process.env.GOOGLE_CALENDAR_ID!,
            requestBody: event as any,
          }
        );

        // Store Google Calendar event ID in database
        if (response.data.id) {
          // You'll need to update your reminders table to have this field
          // For now, we'll just log it
          console.log(
            `Synced reminder ${reminder.id} to Google Calendar event ${response.data.id}`
          );
          syncedCount++;
        }
      } catch (error) {
        console.error(`Failed to sync reminder ${reminder.id}:`, error);
      }
    }

    return NextResponse.json({ message: "Sync completed", synced: syncedCount });
  } catch (error) {
    console.error("Calendar sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync calendar" },
      { status: 500 }
    );
  }
}
