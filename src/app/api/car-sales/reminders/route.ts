import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { carSalesReminders, users } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { google } from "googleapis";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const leadId = searchParams.get('leadId');

    let query = db.select().from(carSalesReminders);

    if (leadId) {
      query = query.where(eq(carSalesReminders.leadId, leadId)) as any;
    }

    const reminders = await query.orderBy(carSalesReminders.reminderDate);
    return NextResponse.json(reminders);
  } catch (error) {
    console.error('Error fetching car sales reminders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reminders' },
      { status: 500 }
    );
  }
}

// Helper function to get access token (copied from sync-reminders)
async function getAccessToken(email: string): Promise<string | null> {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || !user.googleRefreshToken) {
      console.error("No refresh token found for user");
      return null;
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
    );

    oauth2Client.setCredentials({
      refresh_token: user.googleRefreshToken,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    const accessToken = credentials.access_token;

    if (!accessToken) {
      console.error("Failed to get access token");
      return null;
    }

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

// Helper function to sync reminder to calendar
async function syncReminderToCalendar(reminder: any, accessToken: string): Promise<boolean> {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar("v3");
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

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
      await db
        .update(carSalesReminders)
        .set({
          googleEventId: response.data.id,
          updatedAt: new Date(),
        })
        .where(eq(carSalesReminders.id, reminder.id));

      return true;
    }
    return false;
  } catch (error) {
    console.error(`Failed to sync reminder ${reminder.id}:`, error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, reminderDate, reminderType, notes, staffId, userEmail } = body;

    if (!leadId || !reminderType) {
      return NextResponse.json(
        { error: 'leadId and reminderType are required' },
        { status: 400 }
      );
    }

    // Set default reminder date to today if not provided
    const finalReminderDate = reminderDate || new Date().toISOString().split('T')[0];

    const [newReminder] = await db
      .insert(carSalesReminders)
      .values({
        leadId,
        reminderDate: finalReminderDate,
        reminderType,
        notes: notes || null,
        staffId: staffId || null,
        isCompleted: false,
      })
      .returning();

    // Auto-sync to calendar if user email provided
    if (userEmail) {
      const accessToken = await getAccessToken(userEmail);
      if (accessToken) {
        await syncReminderToCalendar(newReminder, accessToken);
        console.log(`✅ Auto-synced reminder "${reminderType}" to Google Calendar`);
      }
    }

    return NextResponse.json(newReminder, { status: 201 });
  } catch (error) {
    console.error('Error creating car sales reminder:', error);
    return NextResponse.json(
      { error: 'Failed to create reminder' },
      { status: 500 }
    );
  }
}
