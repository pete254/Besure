// src/app/api/drafts/[id]/route.ts
// Handle individual draft access by ID

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pgTable, uuid, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";

// Inline drafts table definition (same as in parent route)
const drafts = pgTable("drafts", {
  id: uuid("id").primaryKey().defaultRandom(),
  draftType: varchar("draft_type", { length: 50 }).notNull(),
  draftKey: varchar("draft_key", { length: 100 }).notNull(),
  sessionId: varchar("session_id", { length: 100 }),
  data: text("data").notNull(),
  step: varchar("step", { length: 10 }),
  label: varchar("label", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// GET /api/drafts/[id] - fetch a specific draft by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Draft ID required" }, { status: 400 });
    }

    const [draft] = await db
      .select()
      .from(drafts)
      .where(eq(drafts.id, id))
      .limit(1);

    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    // Parse the JSON data back
    let parsedData;
    try {
      parsedData = JSON.parse(draft.data);
    } catch {
      parsedData = {};
    }

    return NextResponse.json({
      draft: {
        ...draft,
        data: parsedData,
      },
    });
  } catch (error) {
    console.error("GET /api/drafts/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch draft" }, { status: 500 });
  }
}

// PUT /api/drafts/[id] - update a specific draft by ID
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Draft ID required" }, { status: 400 });
    }

    // Check if draft exists
    const [existing] = await db
      .select()
      .from(drafts)
      .where(eq(drafts.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    // Update the draft
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.data !== undefined) {
      updateData.data = JSON.stringify(body.data);
    }
    if (body.step !== undefined) {
      updateData.step = body.step != null ? String(body.step) : null;
    }
    if (body.label !== undefined) {
      updateData.label = body.label || null;
    }

    const [updated] = await db
      .update(drafts)
      .set(updateData)
      .where(eq(drafts.id, id))
      .returning();

    // Parse the JSON data back for response
    let parsedData;
    try {
      parsedData = JSON.parse(updated.data);
    } catch {
      parsedData = {};
    }

    return NextResponse.json({
      draft: {
        ...updated,
        data: parsedData,
      },
    });
  } catch (error) {
    console.error("PUT /api/drafts/[id] error:", error);
    return NextResponse.json({ error: "Failed to update draft" }, { status: 500 });
  }
}

// DELETE /api/drafts/[id] - delete a specific draft by ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Draft ID required" }, { status: 400 });
    }

    // Check if draft exists
    const [existing] = await db
      .select()
      .from(drafts)
      .where(eq(drafts.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    await db.delete(drafts).where(eq(drafts.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/drafts/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete draft" }, { status: 500 });
  }
}
