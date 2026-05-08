import { NextRequest, NextResponse } from "next/server";
import { createCalendarEvent, buildLeadEvents, CarSalesEventInput } from "@/lib/google-calendar";

// Test endpoint for calendar integration (no auth required)
export async function POST(request: NextRequest) {
  try {
    const body: CarSalesEventInput = await request.json();
    
    console.log("Testing calendar sync with:", body);
    
    // Build calendar events from lead data
    const events = buildLeadEvents(body);
    console.log("Built events:", events);
    
    const createdEvents = [];
    
    // Create each event
    for (const eventInput of events) {
      console.log("Creating event:", eventInput);
      const createdEvent = await createCalendarEvent(eventInput);
      createdEvents.push(createdEvent);
      console.log("Created event:", createdEvent);
    }
    
    return NextResponse.json({ 
      success: true, 
      events: createdEvents,
      message: `Created ${createdEvents.length} calendar events for lead ${body.leadId}`
    });
  } catch (error) {
    console.error("Calendar test error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
