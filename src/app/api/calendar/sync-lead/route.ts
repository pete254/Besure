import { NextRequest, NextResponse } from "next/server";
import {
  createCalendarEvent,
  buildLeadEvents,
  CarSalesEventInput,
} from "@/lib/google-calendar";

// POST /api/calendar/sync-lead - Sync a car sales lead to calendar
export async function POST(request: NextRequest) {
  try {
    const body: CarSalesEventInput & { googleEventIds?: string[] } = await request.json();
    
    // Build calendar events from lead data
    const events = buildLeadEvents(body);
    const createdEvents = [];
    
    // Create each event
    for (const eventInput of events) {
      const createdEvent = await createCalendarEvent(eventInput);
      createdEvents.push(createdEvent);
    }
    
    return NextResponse.json({ 
      success: true, 
      events: createdEvents,
      message: `Created ${createdEvents.length} calendar events for lead ${body.leadId}`
    });
  } catch (error) {
    console.error("Calendar sync lead error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
