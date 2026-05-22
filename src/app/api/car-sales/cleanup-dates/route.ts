import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { carSalesLeads, carSalesReminders } from '@/drizzle/schema';
import { sql, eq, isNull } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Check for admin/auth (you may want to add proper auth here)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.API_SECRET_KEY}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find all leads with reminder/commission due dates that were likely auto-populated
    // We'll keep dates that are in the future or have actual reminders
    const today = new Date().toISOString().split('T')[0];

    // Update leads: set dates to null if:
    // 1. reminderDate is not null AND
    // 2. reminderDate is <= today (indicating it was auto-set to creation date) AND
    // 3. There are no actual reminders for this lead
    const result = await db.execute(sql`
      UPDATE car_sales_leads csl
      SET 
        reminder_date = NULL,
        release_date = NULL,
        commission_due_date = NULL
      WHERE 
        (reminder_date IS NOT NULL OR release_date IS NOT NULL OR commission_due_date IS NOT NULL)
        AND (
          reminder_date <= ${today}::date 
          OR release_date <= ${today}::date 
          OR commission_due_date <= ${today}::date
        )
        AND csl.stage NOT IN ('Released', 'Lost', 'Cancelled')
        AND NOT EXISTS (
          SELECT 1 FROM car_sales_reminders csr 
          WHERE csr.lead_id = csl.id
        )
    `);

    return NextResponse.json({
      success: true,
      message: 'Cleanup completed',
      affectedRows: result.rowCount || 0,
    });
  } catch (error) {
    console.error('Error cleaning up lead dates:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup lead dates', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check for admin/auth
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.API_SECRET_KEY}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Preview: Show which leads would be affected
    const today = new Date().toISOString().split('T')[0];
    
    const affectedLeads = await db.execute(sql`
      SELECT 
        csl.id,
        csl.customer_id,
        csl.stage,
        csl.reminder_date,
        csl.release_date,
        csl.commission_due_date,
        csl.created_at,
        (SELECT COUNT(*) FROM car_sales_reminders csr WHERE csr.lead_id = csl.id) as reminder_count
      FROM car_sales_leads csl
      WHERE 
        (reminder_date IS NOT NULL OR release_date IS NOT NULL OR commission_due_date IS NOT NULL)
        AND (
          reminder_date <= ${today}::date 
          OR release_date <= ${today}::date 
          OR commission_due_date <= ${today}::date
        )
        AND csl.stage NOT IN ('Released', 'Lost', 'Cancelled')
        AND NOT EXISTS (
          SELECT 1 FROM car_sales_reminders csr 
          WHERE csr.lead_id = csl.id
        )
      LIMIT 100
    `);

    return NextResponse.json({
      preview: true,
      wouldBeAffected: affectedLeads.rows?.length || 0,
      sampleLeads: affectedLeads.rows?.slice(0, 10),
      message: `Run POST request to execute cleanup on ${affectedLeads.rows?.length || 0} leads`,
    });
  } catch (error) {
    console.error('Error previewing cleanup:', error);
    return NextResponse.json(
      { error: 'Failed to preview cleanup', details: String(error) },
      { status: 500 }
    );
  }
}
