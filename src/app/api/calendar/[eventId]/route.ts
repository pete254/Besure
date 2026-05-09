import { NextRequest, NextResponse } from "next/server";
import {
  updateCalendarEvent,
  deleteCalendarEvent,
  CalendarEventInput,
} from "@/lib/google-calendar";

// PUT /api/calendar/[eventId] - Update event
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await context.params;
    const body: Partial<CalendarEventInput> = await request.json();
    
    const event = await updateCalendarEvent(eventId, body);
    
    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error("Calendar PUT error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// DELETE /api/calendar/[eventId] - Delete event
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await context.params;
    
    await deleteCalendarEvent(eventId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Calendar DELETE error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
