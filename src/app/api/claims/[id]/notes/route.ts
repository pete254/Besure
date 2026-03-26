// src/app/api/claims/[id]/notes/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { followupNotes } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const noteSchema = z.object({
  notes: z.string().min(1),
  channel: z.enum(["Phone", "Email", "WhatsApp", "In-Person"]).optional(),
  nextFollowupDate: z.string().optional().nullable(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = noteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }

    const [note] = await db.insert(followupNotes).values({
      claimId: id,
      notes: parsed.data.notes,
      channel: parsed.data.channel || null,
      nextFollowupDate: parsed.data.nextFollowupDate || null,
      noteDate: new Date(),
    }).returning();

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error("POST /api/claims/[id]/notes error:", error);
    return NextResponse.json({ error: "Failed to add note" }, { status: 500 });
  }
}