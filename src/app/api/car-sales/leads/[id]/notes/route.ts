import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { carSalesNotes, users } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const notes = await db
      .select({
        id: carSalesNotes.id,
        notes: carSalesNotes.notes,
        createdAt: carSalesNotes.createdAt,
        staff: {
          id: users.id,
          name: users.name,
        },
      })
      .from(carSalesNotes)
      .leftJoin(users, eq(carSalesNotes.staffId, users.id))
      .where(eq(carSalesNotes.leadId, id))
      .orderBy(carSalesNotes.createdAt);

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching car sales notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { notes, staffId } = body;

    if (!notes) {
      return NextResponse.json(
        { error: 'Notes are required' },
        { status: 400 }
      );
    }

    const [newNote] = await db
      .insert(carSalesNotes)
      .values({
        leadId: id,
        notes,
        staffId: staffId || null,
      })
      .returning();

    return NextResponse.json(newNote, { status: 201 });
  } catch (error) {
    console.error('Error creating car sales note:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}
