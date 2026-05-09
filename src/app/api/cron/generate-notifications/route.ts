/**
 * POST /api/cron/generate-notifications
 * Generates notification records for upcoming payment reminders and policy expiries
 *
 * This endpoint:
 * 1. Scans for policies expiring in 1, 3, or 10 days
 * 2. Scans for payments due in 1, 3, or 10 days
 * 3. Creates notification_log entries for each
 * 4. Deduplicates to avoid duplicate reminders
 *
 * Requires: CRON_SECRET header for security
 * Schedule: Run every day at midnight (or more frequently for strict reminder timing)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  notificationLog,
  policies,
  payments,
  customers,
  notificationTypeEnum,
} from "@/drizzle/schema";
import { eq, and, isNull, gte, lte, ne } from "drizzle-orm";

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

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Calculate dates for reminders
    const in1Day = new Date(today);
    in1Day.setDate(today.getDate() + 1);
    const in1DayStr = in1Day.toISOString().split("T")[0];

    const in3Days = new Date(today);
    in3Days.setDate(today.getDate() + 3);
    const in3DaysStr = in3Days.toISOString().split("T")[0];

    const in10Days = new Date(today);
    in10Days.setDate(today.getDate() + 10);
    const in10DaysStr = in10Days.toISOString().split("T")[0];

    const results: any = {
      paymentReminders1d: 0,
      paymentReminders3d: 0,
      paymentReminders10d: 0,
      policyExpiryReminders: 0,
      duplicatesSkipped: 0,
      errors: [],
    };

    // ─── Payment reminders: 1 day ──────────────────────────────────────
    const paymentsDue1d = await db
      .select({ id: payments.id, policyId: policies.id })
      .from(payments)
      .leftJoin(policies, eq(payments.policyId, policies.id))
      .where(
        and(
          eq(payments.dueDate, in1DayStr),
          ne(payments.status, "paid")
        )
      );

    for (const p of paymentsDue1d) {
      try {
        // Check if already notified (deduplicate)
        const existing = await db
          .select()
          .from(notificationLog)
          .where(
            and(
              eq(notificationLog.policyId, p.policyId),
              eq(notificationLog.notificationType, "payment_reminder_1d"),
              gte(notificationLog.sentAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
            )
          )
          .limit(1);

        if (existing.length > 0) {
          results.duplicatesSkipped++;
          continue;
        }

        await db.insert(notificationLog).values({
          policyId: p.policyId,
          notificationType: "payment_reminder_1d",
          sentAt: new Date(),
          status: "sent",
        });
        results.paymentReminders1d++;
      } catch (err) {
        results.errors.push({
          type: "payment_1d",
          policyId: p.policyId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // ─── Payment reminders: 3 days ─────────────────────────────────────
    const paymentsDue3d = await db
      .select({ id: payments.id, policyId: policies.id })
      .from(payments)
      .leftJoin(policies, eq(payments.policyId, policies.id))
      .where(
        and(
          eq(payments.dueDate, in3DaysStr),
          ne(payments.status, "paid")
        )
      );

    for (const p of paymentsDue3d) {
      try {
        const existing = await db
          .select()
          .from(notificationLog)
          .where(
            and(
              eq(notificationLog.policyId, p.policyId),
              eq(notificationLog.notificationType, "payment_reminder_3d"),
              gte(notificationLog.sentAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
            )
          )
          .limit(1);

        if (existing.length > 0) {
          results.duplicatesSkipped++;
          continue;
        }

        await db.insert(notificationLog).values({
          policyId: p.policyId,
          notificationType: "payment_reminder_3d",
          sentAt: new Date(),
          status: "sent",
        });
        results.paymentReminders3d++;
      } catch (err) {
        results.errors.push({
          type: "payment_3d",
          policyId: p.policyId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // ─── Payment reminders: 10 days ────────────────────────────────────
    const paymentsDue10d = await db
      .select({ id: payments.id, policyId: policies.id })
      .from(payments)
      .leftJoin(policies, eq(payments.policyId, policies.id))
      .where(
        and(
          eq(payments.dueDate, in10DaysStr),
          ne(payments.status, "paid")
        )
      );

    for (const p of paymentsDue10d) {
      try {
        const existing = await db
          .select()
          .from(notificationLog)
          .where(
            and(
              eq(notificationLog.policyId, p.policyId),
              eq(notificationLog.notificationType, "payment_reminder_10d"),
              gte(notificationLog.sentAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
            )
          )
          .limit(1);

        if (existing.length > 0) {
          results.duplicatesSkipped++;
          continue;
        }

        await db.insert(notificationLog).values({
          policyId: p.policyId,
          notificationType: "payment_reminder_10d",
          sentAt: new Date(),
          status: "sent",
        });
        results.paymentReminders10d++;
      } catch (err) {
        results.errors.push({
          type: "payment_10d",
          policyId: p.policyId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // ─── Policy expiry reminders ───────────────────────────────────────
    const expiringPolicies = await db
      .select({ id: policies.id })
      .from(policies)
      .where(
        and(
          gte(policies.endDate, todayStr),
          lte(policies.endDate, in10DaysStr),
          eq(policies.status, "Active")
        )
      );

    for (const p of expiringPolicies) {
      try {
        const existing = await db
          .select()
          .from(notificationLog)
          .where(
            and(
              eq(notificationLog.policyId, p.id),
              eq(notificationLog.notificationType, "policy_expiry"),
              gte(notificationLog.sentAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
            )
          )
          .limit(1);

        if (existing.length > 0) {
          results.duplicatesSkipped++;
          continue;
        }

        await db.insert(notificationLog).values({
          policyId: p.id,
          notificationType: "policy_expiry",
          sentAt: new Date(),
          status: "sent",
        });
        results.policyExpiryReminders++;
      } catch (err) {
        results.errors.push({
          type: "policy_expiry",
          policyId: p.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const totalCreated =
      results.paymentReminders1d +
      results.paymentReminders3d +
      results.paymentReminders10d +
      results.policyExpiryReminders;

    return NextResponse.json({
      success: true,
      message: `Generated ${totalCreated} notifications (${results.duplicatesSkipped} duplicates skipped)`,
      ...results,
    });
  } catch (error) {
    console.error("Generate notifications error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ─── GET for status checking ───────────────────────────────────────────────
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

    const totalNotifications = await db
      .select({ count: notificationLog.id })
      .from(notificationLog);

    const unsynced = await db
      .select({ count: notificationLog.id })
      .from(notificationLog)
      .where(isNull(notificationLog.googleEventId));

    return NextResponse.json({
      status: "ok",
      totalNotifications: totalNotifications[0]?.count || 0,
      unsyncedNotifications: unsynced[0]?.count || 0,
      message: "Use POST method to generate notifications",
    });
  } catch (error) {
    console.error("Notification status error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
