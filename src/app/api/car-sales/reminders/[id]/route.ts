import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { carSalesReminders } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [reminder] = await db
      .select()
      .from(carSalesReminders)
      .where(eq(carSalesReminders.id, id));

    if (!reminder) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(reminder);
  } catch (error) {
    console.error('Error fetching car sales reminder:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reminder' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isCompleted, reminderType, notes } = body;

    const [updatedReminder] = await db
      .update(carSalesReminders)
      .set({
        isCompleted: isCompleted !== undefined ? isCompleted : undefined,
        reminderType: reminderType || undefined,
        notes: notes !== undefined ? notes : undefined,
      })
      .where(eq(carSalesReminders.id, id))
      .returning();

    if (!updatedReminder) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedReminder);
  } catch (error) {
    console.error('Error updating car sales reminder:', error);
    return NextResponse.json(
      { error: 'Failed to update reminder' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [deletedReminder] = await db
      .delete(carSalesReminders)
      .where(eq(carSalesReminders.id, id))
      .returning();

    if (!deletedReminder) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    console.error('Error deleting car sales reminder:', error);
    return NextResponse.json(
      { error: 'Failed to delete reminder' },
      { status: 500 }
    );
  }
}
