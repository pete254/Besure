import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { carSalesReminders } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const leadId = searchParams.get('leadId');

    let query = db.select().from(carSalesReminders);

    if (leadId) {
      query = query.where(eq(carSalesReminders.leadId, leadId)) as any;
    }

    const reminders = await query.orderBy(carSalesReminders.reminderDate);
    return NextResponse.json(reminders);
  } catch (error) {
    console.error('Error fetching car sales reminders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reminders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, reminderDate, reminderType, notes, staffId } = body;

    if (!leadId || !reminderDate || !reminderType) {
      return NextResponse.json(
        { error: 'leadId, reminderDate, and reminderType are required' },
        { status: 400 }
      );
    }

    const [newReminder] = await db
      .insert(carSalesReminders)
      .values({
        leadId,
        reminderDate: reminderDate,
        reminderType,
        notes: notes || null,
        staffId: staffId || null,
        isCompleted: false,
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
