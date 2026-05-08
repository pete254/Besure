import { NextRequest, NextResponse } from "next/server";
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  listCalendarEvents,
  CalendarEventInput,
} from "@/lib/google-calendar";

// GET /api/calendar - List events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const maxResults = parseInt(searchParams.get("maxResults") || "50");
    const timeMin = searchParams.get("timeMin") || undefined;

    const events = await listCalendarEvents(maxResults, timeMin);
    
    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error("Calendar GET error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST /api/calendar - Create event
export async function POST(request: NextRequest) {
  try {
    const body: CalendarEventInput = await request.json();
    
    const event = await createCalendarEvent(body);
    
    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error("Calendar POST error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
