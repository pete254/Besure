import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { carSalesReminders, users } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reminders = await db
      .select({
        id: carSalesReminders.id,
        reminderDate: carSalesReminders.reminderDate,
        reminderType: carSalesReminders.reminderType,
        notes: carSalesReminders.notes,
        isCompleted: carSalesReminders.isCompleted,
        createdAt: carSalesReminders.createdAt,
        staff: {
          id: users.id,
          name: users.name,
        },
      })
      .from(carSalesReminders)
      .leftJoin(users, eq(carSalesReminders.staffId, users.id))
      .where(eq(carSalesReminders.leadId, params.id))
      .orderBy(carSalesReminders.reminderDate);

    return NextResponse.json(reminders);
  } catch (error) {
    console.error('Error fetching car sales reminders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reminders' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { reminderDate, reminderType, notes, staffId } = body;

    if (!reminderDate || !reminderType) {
      return NextResponse.json(
        { error: 'Reminder date and type are required' },
        { status: 400 }
      );
    }

    const [newReminder] = await db
      .insert(carSalesReminders)
      .values({
        leadId: params.id,
        reminderDate,
        reminderType,
        notes: notes || null,
        staffId: staffId || null,
      })
      .returning();

    return NextResponse.json(newReminder, { status: 201 });
  } catch (error) {
    console.error('Error creating car sales reminder:', error);
    return NextResponse.json(
      { error: 'Failed to create reminder' },
      { status: 500 }
    );
  }
}
