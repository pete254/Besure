import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { carSalesLeads, carSalesCustomers } from '@/drizzle/schema';
import { eq, and, or, ilike } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage');
    const search = searchParams.get('search');

    // Build the base query
    const baseQuery = db
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

    // Build conditions
    const conditions = [];
    
    // Filter by stage if provided
    if (stage) {
      conditions.push(eq(carSalesLeads.stage, stage as any));
    }

    // Search functionality
    if (search) {
      const searchCondition = or(
        ilike(carSalesCustomers.name, `%${search}%`),
        ilike(carSalesCustomers.phone, `%${search}%`),
        ilike(carSalesLeads.registrationNumber, `%${search}%`),
        ilike(carSalesLeads.carType, `%${search}%`)
      );
      conditions.push(searchCondition);
    }

    // Apply conditions and execute query
    let leads;
    if (conditions.length > 0) {
      if (conditions.length === 1) {
        leads = await baseQuery.where(conditions[0]).orderBy(carSalesLeads.updatedAt);
      } else {
        leads = await baseQuery.where(and(...conditions)).orderBy(carSalesLeads.updatedAt);
      }
    } else {
      leads = await baseQuery.orderBy(carSalesLeads.updatedAt);
    }

    // Group by stage for pipeline view
    const pipeline = {
      "New Lead": leads.filter(lead => lead.stage === "New Lead"),
      "Follow Up": leads.filter(lead => lead.stage === "Follow Up"),
      "Hot Prospect": leads.filter(lead => lead.stage === "Hot Prospect"),
      "Deposit Paid": leads.filter(lead => lead.stage === "Deposit Paid"),
      "Released": leads.filter(lead => lead.stage === "Released"),
      "Lost": leads.filter(lead => lead.stage === "Lost"),
      "Cancelled": leads.filter(lead => lead.stage === "Cancelled"),
    };

    return NextResponse.json(pipeline);
  } catch (error) {
    console.error('Error fetching car sales pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipeline' },
      { status: 500 }
    );
  }
}
