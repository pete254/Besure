// Google Calendar integration using Service Account
// No OAuth flow needed — just share your Google Calendar with the service account

import { JWT } from "google-auth-library";
import { google, calendar_v3 } from "googleapis";

/**
 * Creates an authenticated Google Calendar client using a Service Account.
 *
 * Setup steps:
 * 1. Go to console.cloud.google.com → Create project → Enable "Google Calendar API"
 * 2. IAM & Admin → Service Accounts → Create service account
 * 3. Create JSON key → download it
 * 4. Add these env vars to .env.local:
 *    GOOGLE_SERVICE_ACCOUNT_EMAIL=your-sa@project.iam.gserviceaccount.com
 *    GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
 *    GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com  (or use "primary")
 * 5. Share your Google Calendar with the service account email (give "Make changes to events" permission)
 */
function getCalendarClient(): calendar_v3.Calendar {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!email || !key) {
    throw new Error(
      "Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY env vars. " +
      "See src/lib/google-calendar.ts for setup instructions."
    );
  }

  const auth = new JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  return google.calendar({ version: "v3", auth });
}

export const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary";

// ─── Event types ──────────────────────────────────────────────────────────────

export interface CalendarEventInput {
  title: string;
  description?: string;
  startDate: string; // ISO date string e.g. "2025-06-15"
  endDate?: string;  // ISO date string — defaults to startDate + 1 day
  location?: string;
  colorId?: string;  // Google Calendar color IDs: 1=Lavender, 2=Sage, 3=Grape, 4=Flamingo, 5=Banana, 6=Tangerine, 7=Peacock, 8=Graphite, 9=Blueberry, 10=Basil, 11=Tomato
}

// ─── CRUD operations ──────────────────────────────────────────────────────────

/** Create a new calendar event. Returns the created event with its Google ID. */
export async function createCalendarEvent(
  input: CalendarEventInput
): Promise<calendar_v3.Schema$Event> {
  const cal = getCalendarClient();

  const startDate = input.startDate;
  const endDate = input.endDate || (() => {
    const d = new Date(input.startDate);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  })();

  const { data } = await cal.events.insert({
    calendarId: CALENDAR_ID,
    requestBody: {
      summary: input.title,
      description: input.description,
      location: input.location,
      colorId: input.colorId,
      start: { date: startDate },
      end: { date: endDate },
    },
  });

  return data;
}

/** Update an existing calendar event by its Google event ID. */
export async function updateCalendarEvent(
  googleEventId: string,
  input: Partial<CalendarEventInput>
): Promise<calendar_v3.Schema$Event> {
  const cal = getCalendarClient();

  // Fetch existing first to merge
  const { data: existing } = await cal.events.get({
    calendarId: CALENDAR_ID,
    eventId: googleEventId,
  });

  const startDate = input.startDate || existing.start?.date || "";
  const endDate = input.endDate || (() => {
    if (input.startDate) {
      const d = new Date(input.startDate);
      d.setDate(d.getDate() + 1);
      return d.toISOString().split("T")[0];
    }
    return existing.end?.date || "";
  })();

  const { data } = await cal.events.update({
    calendarId: CALENDAR_ID,
    eventId: googleEventId,
    requestBody: {
      ...existing,
      summary: input.title ?? existing.summary,
      description: input.description ?? existing.description,
      location: input.location ?? existing.location,
      colorId: input.colorId ?? existing.colorId,
      start: { date: startDate },
      end: { date: endDate },
    },
  });

  return data;
}

/** Delete a calendar event by its Google event ID. */
export async function deleteCalendarEvent(googleEventId: string): Promise<void> {
  const cal = getCalendarClient();
  await cal.events.delete({
    calendarId: CALENDAR_ID,
    eventId: googleEventId,
  });
}

/** List upcoming calendar events. */
export async function listCalendarEvents(
  maxResults = 50,
  timeMin?: string
): Promise<calendar_v3.Schema$Event[]> {
  const cal = getCalendarClient();
  const { data } = await cal.events.list({
    calendarId: CALENDAR_ID,
    timeMin: timeMin || new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: "startTime",
  });
  return data.items || [];
}

// ─── Car Sales specific helpers ───────────────────────────────────────────────

/** Color codes for different car sales stages */
const STAGE_COLOR_MAP: Record<string, string> = {
  "New Lead": "7",       // Peacock (teal)
  "Follow Up": "5",      // Banana (yellow)
  "Hot Prospect": "6",   // Tangerine (orange)
  "Deposit Paid": "3",   // Grape (purple)
  "Released": "10",      // Basil (green)
  "Lost": "11",          // Tomato (red)
  "Cancelled": "8",      // Graphite (grey)
};

export interface CarSalesEventInput {
  leadId: string;
  customerName: string;
  carType: string;
  registrationNumber: string;
  stage: string;
  reminderDate?: string | null;
  releaseDate?: string | null;
  commissionDueDate?: string | null;
  notes?: string | null;
}

/** Build calendar events from a car sales lead's important dates */
export function buildLeadEvents(input: CarSalesEventInput): CalendarEventInput[] {
  const events: CalendarEventInput[] = [];
  const base = `${input.customerName} — ${input.carType} (${input.registrationNumber})`;

  if (input.reminderDate) {
    events.push({
      title: `📞 Follow Up: ${base}`,
      description: `Stage: ${input.stage}\nLead ID: ${input.leadId}${input.notes ? `\n\n${input.notes}` : ""}`,
      startDate: input.reminderDate,
      colorId: STAGE_COLOR_MAP[input.stage] || "7",
    });
  }

  if (input.releaseDate) {
    events.push({
      title: `🚗 Release: ${base}`,
      description: `Car released to customer.\nLead ID: ${input.leadId}`,
      startDate: input.releaseDate,
      colorId: STAGE_COLOR_MAP["Released"],
    });
  }

  if (input.commissionDueDate) {
    events.push({
      title: `💰 Commission Due: ${base}`,
      description: `Commission payment expected.\nLead ID: ${input.leadId}`,
      startDate: input.commissionDueDate,
      colorId: STAGE_COLOR_MAP["Deposit Paid"],
    });
  }

  return events;
}
