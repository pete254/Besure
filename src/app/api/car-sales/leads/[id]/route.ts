import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { carSalesLeads, carSalesCustomers } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [lead] = await db
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
      .leftJoin(carSalesCustomers, eq(carSalesLeads.customerId, carSalesCustomers.id))
      .where(eq(carSalesLeads.id, id));

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error fetching car sales lead:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead' },
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
    const {
      stage,
      carType,
      registrationNumber,
      commissionAmount,
      purchaseType,
      selectedBank,
      depositAmount,
      paymentDate,
      balanceRemaining,
      reminderDate,
      releaseDate,
      commissionDueDate,
      commissionStatus,
      finalNotes,
      lostReason,
      cancelledReason,
      followUpNotes,
      nextAction,
    } = body;

    // Auto-calculate commission due date when releasing
    let calculatedCommissionDueDate = commissionDueDate;
    if (releaseDate && !commissionDueDate) {
      const release = new Date(releaseDate);
      release.setDate(release.getDate() + 14); // Add 14 days
      calculatedCommissionDueDate = release.toISOString().split('T')[0];
    }

    const [updatedLead] = await db
      .update(carSalesLeads)
      .set({
        stage: stage || undefined,
        carType: carType || undefined,
        registrationNumber: registrationNumber || undefined,
        commissionAmount: commissionAmount || undefined,
        purchaseType: purchaseType || undefined,
        selectedBank: selectedBank || undefined,
        depositAmount: depositAmount || undefined,
        paymentDate: paymentDate || undefined,
        balanceRemaining: balanceRemaining || undefined,
        reminderDate: reminderDate || undefined,
        releaseDate: releaseDate || undefined,
        commissionDueDate: calculatedCommissionDueDate || undefined,
        commissionStatus: commissionStatus || undefined,
        finalNotes: finalNotes || undefined,
        lostReason: lostReason || undefined,
        cancelledReason: cancelledReason || undefined,
        followUpNotes: followUpNotes || undefined,
        nextAction: nextAction || undefined,
        updatedAt: new Date(),
      })
      .where(eq(carSalesLeads.id, id))
      .returning();

    if (!updatedLead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error('Error updating car sales lead:', error);
    return NextResponse.json(
      { error: 'Failed to update lead' },
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
    const [deletedLead] = await db
      .delete(carSalesLeads)
      .where(eq(carSalesLeads.id, id))
      .returning();

    if (!deletedLead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting car sales lead:', error);
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    );
  }
}
