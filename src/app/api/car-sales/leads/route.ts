import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { carSalesLeads, carSalesCustomers } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { buildLeadEvents, createCalendarEvent, CarSalesEventInput } from '@/lib/google-calendar';

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
      reminderDate,
      releaseDate,
      commissionDueDate,
      followUpNotes,
    } = body;

    if (!customerId || !carType || !registrationNumber) {
      return NextResponse.json(
        { error: 'Customer ID, car type, and registration number are required' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format

    const [newLead] = await db
      .insert(carSalesLeads)
      .values({
        customerId,
        stage,
        carType,
        registrationNumber,
        commissionAmount: commissionAmount || null,
        reminderDate: reminderDate || today,
        releaseDate: releaseDate || today,
        commissionDueDate: commissionDueDate || today,
        followUpNotes: followUpNotes || null,
      })
      .returning();

    // Get customer details for calendar sync
    const [customer] = await db
      .select()
      .from(carSalesCustomers)
      .where(eq(carSalesCustomers.id, customerId));

    // Sync to calendar if customer data is available
    let calendarEvents = [];
    if (customer) {
      try {
        const leadEventData: CarSalesEventInput = {
          leadId: newLead.id,
          customerName: customer.name,
          carType: newLead.carType,
          registrationNumber: newLead.registrationNumber,
          stage: newLead.stage,
          reminderDate: newLead.reminderDate,
          releaseDate: newLead.releaseDate,
          commissionDueDate: newLead.commissionDueDate,
          notes: newLead.followUpNotes,
        };

        const events = buildLeadEvents(leadEventData);
        for (const eventInput of events) {
          const createdEvent = await createCalendarEvent(eventInput);
          calendarEvents.push(createdEvent);
        }
      } catch (calendarError) {
        console.error('Calendar sync failed:', calendarError);
        // Continue even if calendar sync fails
      }
    }

    return NextResponse.json({ 
      lead: newLead, 
      calendarEvents,
      message: calendarEvents.length > 0 
        ? `Lead created with ${calendarEvents.length} calendar events` 
        : 'Lead created (calendar sync skipped)'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating car sales lead:', error);
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }
}
