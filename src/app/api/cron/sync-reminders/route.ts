/**
 * POST /api/cron/sync-reminders
 * Syncs pending notification reminders to Google Calendar
 *
 * Requires: CRON_SECRET header for security
 * Usage: curl -X POST http://localhost:3000/api/cron/sync-reminders \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET"
 *
 * For production: Set up with Vercel Crons or external cron service
 * See: https://vercel.com/docs/crons/quickstart
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notificationLog, policies, customers } from "@/drizzle/schema";
import { eq, isNull } from "drizzle-orm";
import { createCalendarEvent, buildNotificationEvent } from "@/lib/google-calendar";

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

    // ─── Fetch unsent notifications ────────────────────────────────────
    const unsyncedNotifications = await db
      .select({
        id: notificationLog.id,
        policyId: notificationLog.policyId,
        notificationType: notificationLog.notificationType,
        sentAt: notificationLog.sentAt,
        status: notificationLog.status,
        googleEventId: notificationLog.googleEventId,
        customerFirstName: customers.firstName,
        customerLastName: customers.lastName,
      })
      .from(notificationLog)
      .leftJoin(policies, eq(notificationLog.policyId, policies.id))
      .leftJoin(customers, eq(policies.customerId, customers.id))
      .where(isNull(notificationLog.googleEventId))
      .limit(50);

    if (unsyncedNotifications.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No unsynced notifications found",
        synced: 0,
      });
    }

    // ─── Create calendar events ────────────────────────────────────────
    const results: any[] = [];
    let synced = 0;
    let failed = 0;

    for (const notif of unsyncedNotifications) {
      try {
        const customerName =
          notif.customerFirstName && notif.customerLastName
            ? `${notif.customerFirstName} ${notif.customerLastName}`
            : undefined;

        // Build and create the calendar event
        const eventInput = buildNotificationEvent({
          id: notif.id,
          notificationType: notif.notificationType,
          sentAt: notif.sentAt,
          policyId: notif.policyId || undefined,
          customerName,
        });

        const createdEvent = await createCalendarEvent(eventInput);

        // Update the notification record with the Google event ID
        await db
          .update(notificationLog)
          .set({
            googleEventId: createdEvent.id,
            googleCalendarSyncedAt: new Date(),
          })
          .where(eq(notificationLog.id, notif.id));

        results.push({
          notificationId: notif.id,
          googleEventId: createdEvent.id,
          status: "success",
        });

        synced++;
      } catch (error) {
        failed++;
        results.push({
          notificationId: notif.id,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
        console.error(
          `Failed to sync notification ${notif.id}:`,
          error instanceof Error ? error.message : error
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${synced} reminders to Google Calendar (${failed} failed)`,
      synced,
      failed,
      total: unsyncedNotifications.length,
      results,
    });
  } catch (error) {
    console.error("Cron sync-reminders error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ─── GET endpoint for testing ──────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    const providedSecret = authHeader?.replace("Bearer ", "");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || providedSecret !== cronSecret) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid or missing CRON_SECRET" },
        { status: 401 }
      );
    }

    // Show stats about pending syncs
    const pendingCount = await db
      .select({ count: notificationLog.id })
      .from(notificationLog)
      .where(isNull(notificationLog.googleEventId));

    return NextResponse.json({
      status: "ok",
      pendingNotificationCount: pendingCount[0]?.count || 0,
      message: "Use POST method to trigger sync",
    });
  } catch (error) {
    console.error("Cron status error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
