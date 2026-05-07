import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { carSalesCustomers } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const customers = await db.select().from(carSalesCustomers);
    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error fetching car sales customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, sourceOfLead } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      );
    }

    const [newCustomer] = await db
      .insert(carSalesCustomers)
      .values({
        name,
        phone,
        email: email || null,
        sourceOfLead: sourceOfLead || null,
      })
      .returning();

    return NextResponse.json(newCustomer, { status: 201 });
  } catch (error) {
    console.error('Error creating car sales customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}
