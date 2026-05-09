/**
 * POST /api/cron/sync-car-sales-reminders
 * Syncs car sales reminders to Google Calendar
 *
 * Syncs reminders where googleEventId is null (unsynced)
 * to Google Calendar, then updates the database with the event ID
 *
 * Requires: CRON_SECRET header for security
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { carSalesReminders, carSalesLeads, carSalesCustomers } from "@/drizzle/schema";
import { eq, isNull } from "drizzle-orm";
import { createCalendarEvent, buildLeadEvents, CarSalesEventInput } from "@/lib/google-calendar";

export async function POST(request: NextRequest) {
  try {
    // ─── Verify CRON_SECRET ───────────────────────────────────────────
    const authHeader = request.headers.get("Authorization");
    const providedSecret = authHeader?.replace("Bearer ", "");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || providedSecret !== cronSecret) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid or missing CRON_SECRET" },
        { status: 401 }
      );
    }

    // ─── Fetch unsynced car sales reminders ────────────────────────────
    const unsyncedReminders = await db
      .select({
        id: carSalesReminders.id,
        leadId: carSalesReminders.leadId,
        reminderDate: carSalesReminders.reminderDate,
        reminderType: carSalesReminders.reminderType,
        notes: carSalesReminders.notes,
        carType: carSalesLeads.carType,
        registrationNumber: carSalesLeads.registrationNumber,
        stage: carSalesLeads.stage,
        releaseDate: carSalesLeads.releaseDate,
        commissionDueDate: carSalesLeads.commissionDueDate,
        customerName: carSalesCustomers.name,
      })
      .from(carSalesReminders)
      .leftJoin(carSalesLeads, eq(carSalesReminders.leadId, carSalesLeads.id))
      .leftJoin(carSalesCustomers, eq(carSalesLeads.customerId, carSalesCustomers.id))
      .where(isNull(carSalesReminders.googleEventId))
      .limit(50);

    if (unsyncedReminders.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No unsynced car sales reminders found",
        synced: 0,
      });
    }

    // ─── Create calendar events ────────────────────────────────────────
    const results: any[] = [];
    let synced = 0;
    let failed = 0;

    for (const reminder of unsyncedReminders) {
      try {
        // Build a calendar event from the reminder + lead data
        const eventInput: CarSalesEventInput = {
          leadId: reminder.leadId,
          customerName: reminder.customerName || "Unknown Customer",
          carType: reminder.carType,
          registrationNumber: reminder.registrationNumber,
          stage: reminder.stage,
          reminderDate: reminder.reminderDate,
          releaseDate: reminder.releaseDate || undefined,
          commissionDueDate: reminder.commissionDueDate || undefined,
          notes: reminder.notes || reminder.reminderType,
        };

        // buildLeadEvents creates multiple events (reminder, release, commission)
        // but for car sales reminders, we just need the one for this specific reminder
        const allEvents = buildLeadEvents(eventInput);
        
        // Filter to only the reminder event that matches this reminder's date
        const matchingEvent = allEvents.find(e => e.startDate === reminder.reminderDate);
        
        if (!matchingEvent) {
          failed++;
          results.push({
            reminderId: reminder.id,
            status: "failed",
            error: "No matching event built from reminder data",
          });
          continue;
        }

        const createdEvent = await createCalendarEvent(matchingEvent);

        // Update the reminder record with the Google event ID
        await db
          .update(carSalesReminders)
          .set({
            googleEventId: createdEvent.id,
            updatedAt: new Date(),
          })
          .where(eq(carSalesReminders.id, reminder.id));

        results.push({
          reminderId: reminder.id,
          googleEventId: createdEvent.id,
          reminderDate: reminder.reminderDate,
          status: "success",
        });

        synced++;
      } catch (error) {
        failed++;
        results.push({
          reminderId: reminder.id,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
        console.error(
          `Failed to sync car sales reminder ${reminder.id}:`,
          error instanceof Error ? error.message : error
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${synced} car sales reminders to Google Calendar (${failed} failed)`,
      synced,
      failed,
      total: unsyncedReminders.length,
      results,
    });
  } catch (error) {
    console.error("Cron sync car sales reminders error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ─── GET for status ────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    const providedSecret = authHeader?.replace("Bearer ", "");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || providedSecret !== cronSecret) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const totalReminders = await db
      .select({ count: carSalesReminders.id })
      .from(carSalesReminders);

    const unsyncedCount = await db
      .select({ count: carSalesReminders.id })
      .from(carSalesReminders)
      .where(isNull(carSalesReminders.googleEventId));

    return NextResponse.json({
      status: "ok",
      totalCarSalesReminders: totalReminders[0]?.count || 0,
      unsyncedCarSalesReminders: unsyncedCount[0]?.count || 0,
      message: "Use POST method to trigger sync",
    });
  } catch (error) {
    console.error("Car sales reminders status error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
