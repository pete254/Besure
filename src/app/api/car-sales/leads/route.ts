import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { carSalesLeads, carSalesCustomers } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const leads = await db
      .select({
        id: carSalesLeads.id,
        stage: carSalesLeads.stage,
        carType: carSalesLeads.carType,
        registrationNumber: carSalesLeads.registrationNumber,
        commissionAmount: carSalesLeads.commissionAmount,
        purchaseType: carSalesLeads.purchaseType,
        selectedBank: carSalesLeads.selectedBank,
        depositAmount: carSalesLeads.depositAmount,
        paymentDate: carSalesLeads.paymentDate,
        balanceRemaining: carSalesLeads.balanceRemaining,
        reminderDate: carSalesLeads.reminderDate,
        releaseDate: carSalesLeads.releaseDate,
        commissionDueDate: carSalesLeads.commissionDueDate,
        commissionStatus: carSalesLeads.commissionStatus,
        finalNotes: carSalesLeads.finalNotes,
        lostReason: carSalesLeads.lostReason,
        cancelledReason: carSalesLeads.cancelledReason,
        followUpNotes: carSalesLeads.followUpNotes,
        nextAction: carSalesLeads.nextAction,
        createdAt: carSalesLeads.createdAt,
        updatedAt: carSalesLeads.updatedAt,
        customer: {
          id: carSalesCustomers.id,
          name: carSalesCustomers.name,
          phone: carSalesCustomers.phone,
          email: carSalesCustomers.email,
          sourceOfLead: carSalesCustomers.sourceOfLead,
        },
      })
      .from(carSalesLeads)
      .leftJoin(carSalesCustomers, eq(carSalesLeads.customerId, carSalesCustomers.id));

    return NextResponse.json(leads);
  } catch (error) {
    console.error('Error fetching car sales leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerId,
      carType,
      registrationNumber,
      commissionAmount,
      stage = "New Lead",
    } = body;

    if (!customerId || !carType || !registrationNumber) {
      return NextResponse.json(
        { error: 'Customer ID, car type, and registration number are required' },
        { status: 400 }
      );
    }

    const [newLead] = await db
      .insert(carSalesLeads)
      .values({
        customerId,
        stage,
        carType,
        registrationNumber,
        commissionAmount: commissionAmount || null,
      })
      .returning();

    return NextResponse.json(newLead, { status: 201 });
  } catch (error) {
    console.error('Error creating car sales lead:', error);
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }
}
