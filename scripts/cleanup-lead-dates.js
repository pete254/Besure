#!/usr/bin/env node
/**
 * Cleanup script for car sales leads
 * Removes auto-populated dates from existing leads that don't have actual reminders
 * 
 * Usage:
 *   npm run cleanup-lead-dates
 *   OR
 *   node scripts/cleanup-lead-dates.js
 */

import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

async function cleanupLeadDates() {
  try {
    console.log('🔍 Scanning for leads with auto-populated dates...\n');

    const today = new Date().toISOString().split('T')[0];

    // Preview affected leads
    const previewResult = await db.execute(sql`
      SELECT 
        csl.id,
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
    `);

    const affectedCount = previewResult.rows?.length || 0;
    console.log(`Found ${affectedCount} leads to clean up\n`);

    if (affectedCount === 0) {
      console.log('✅ No leads need cleanup!');
      return;
    }

    // Show sample
    const samples = previewResult.rows?.slice(0, 3) || [];
    console.log('Sample leads to be cleaned:');
    samples.forEach((lead: any, idx: number) => {
      console.log(`  ${idx + 1}. Stage: ${lead.stage}`);
      console.log(`     - Reminder Date: ${lead.reminder_date}`);
      console.log(`     - Release Date: ${lead.release_date}`);
      console.log(`     - Commission Due: ${lead.commission_due_date}`);
      console.log(`     - Actual Reminders: ${lead.reminder_count}`);
      console.log();
    });

    // Execute cleanup
    console.log('🧹 Cleaning up dates...\n');
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

    console.log(`✅ Cleanup completed!`);
    console.log(`📊 Updated ${result.rowCount || affectedCount} leads`);
    console.log(`\n   All false date warnings have been removed.`);
    console.log(`   Users can now add reminders explicitly via the modal.\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanupLeadDates();
