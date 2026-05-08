// src/app/api/drafts/route.ts
// Generic draft storage — persists policy/claim wizard state so users can pick up where they left off
// Drafts are stored in a simple key-value style using the existing DB or localStorage bridge
// This implementation uses Neon DB for server-side draft persistence

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { drafts } from "@/drizzle/schema";

const saveDraftSchema = z.object({
  draftType: z.enum(["policy", "claim"]),
  draftKey: z.string().min(1),
  sessionId: z.string().optional().nullable(),
  data: z.unknown(),                  // the wizard's full state object
  step: z.union([z.string(), z.number()]).optional().nullable(),
  label: z.string().optional().nullable(),   // friendly display name
});

// GET /api/drafts?type=policy&key=policy-new&sessionId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const draftType = searchParams.get("type");
    const draftKey = searchParams.get("key");
    const sessionId = searchParams.get("sessionId");

    if (!draftType) {
      // List all drafts of a type for a session
      const query = sessionId
        ? await db.select().from(drafts).where(eq(drafts.sessionId, sessionId))
        : await db.select().from(drafts);
      return NextResponse.json({ drafts: query });
    }

    if (!draftKey) {
      // List drafts by type
      const query = await db.select().from(drafts).where(eq(drafts.draftType, draftType));
      return NextResponse.json({ drafts: query });
    }

    // Fetch specific draft
    let conditions = [
      eq(drafts.draftType, draftType),
      eq(drafts.draftKey, draftKey),
    ];

    const results = await db
      .select()
      .from(drafts)
      .where(and(...conditions));

    // Filter by sessionId client-side since and() with optional condition is tricky
    const filtered = sessionId
      ? results.filter(d => d.sessionId === sessionId || !d.sessionId)
      : results;

    const draft = filtered[0] || null;

    if (!draft) {
      return NextResponse.json({ draft: null });
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
    console.error("GET /api/drafts error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to fetch draft: ${errorMessage}` }, { status: 500 });
  }
}

// POST /api/drafts — save or update a draft
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("POST /api/drafts - Request body:", JSON.stringify(body, null, 2));
    const parsed = saveDraftSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { draftType, draftKey, sessionId, data, step, label } = parsed.data;
    console.log("Parsed draft data:", { draftType, draftKey, sessionId, step, label });

    // Check if draft already exists for this key + session
    const existing = await db
      .select()
      .from(drafts)
      .where(and(eq(drafts.draftType, draftType), eq(drafts.draftKey, draftKey)));

    console.log("Existing drafts for this key:", existing.length, existing.map(d => ({ id: d.id, sessionId: d.sessionId })));

    const match = sessionId
      ? existing.find(d => d.sessionId === sessionId)
      : existing[0];

    console.log("Match found:", match ? match.id : 'none');

    const serialized = JSON.stringify(data);
    const stepStr = step != null ? String(step) : null;

    // Set expiry 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    if (match) {
      console.log("Updating existing draft:", match.id);
      const [updated] = await db
        .update(drafts)
        .set({
          data: serialized,
          step: stepStr,
          label: label || match.label,
          updatedAt: new Date(),
          expiresAt,
        })
        .where(eq(drafts.id, match.id))
        .returning();

      console.log("Draft updated successfully:", updated.id);
      return NextResponse.json({ draft: { ...updated, data } });
    }

    console.log("Creating new draft");
    const [newDraft] = await db
      .insert(drafts)
      .values({
        draftType,
        draftKey,
        sessionId: sessionId || null,
        data: serialized,
        step: stepStr,
        label: label || null,
        expiresAt,
      })
      .returning();

    console.log("Draft created successfully:", newDraft.id);
    return NextResponse.json({ draft: { ...newDraft, data } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/drafts error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to save draft: ${errorMessage}` }, { status: 500 });
  }
}

// DELETE /api/drafts?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Draft ID required" }, { status: 400 });
    }

    await db.delete(drafts).where(eq(drafts.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/drafts error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to delete draft: ${errorMessage}` }, { status: 500 });
  }
}