import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { carSalesCustomers, CarSalesCustomer } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [customer] = await db
      .select()
      .from(carSalesCustomers)
      .where(eq(carSalesCustomers.id, id));

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error fetching car sales customer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, phone, email, sourceOfLead } = body;

    const [updatedCustomer] = await db
      .update(carSalesCustomers)
      .set({
        name: name || undefined,
        phone: phone || undefined,
        email: email || null,
        sourceOfLead: sourceOfLead || null,
        updatedAt: new Date(),
      })
      .where(eq(carSalesCustomers.id, id))
      .returning();

    if (!updatedCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error('Error updating car sales customer:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
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
    const [deletedCustomer] = await db
      .delete(carSalesCustomers)
      .where(eq(carSalesCustomers.id, id))
      .returning();

    if (!deletedCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting car sales customer:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
