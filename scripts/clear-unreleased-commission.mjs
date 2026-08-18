#!/usr/bin/env node
/**
 * Clears the "commission due" mark on car-sales leads that have NOT been released.
 *
 * Commission only becomes payable once a car is actually released, so any lead
 * still in New Lead / Follow Up / Hot Prospect / Deposit Paid / Lost / Cancelled
 * should not carry a commission_due_date (which is what drives the red
 * "Commission overdue" badge in the pipeline).
 *
 * Usage:
 *   node scripts/clear-unreleased-commission.mjs           # preview only (dry run)
 *   node scripts/clear-unreleased-commission.mjs --apply   # actually clear them
 */

import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ DATABASE_URL not found (looked in .env.local).");
  process.exit(1);
}

const apply = process.argv.includes("--apply");
const sql = neon(url);

async function run() {
  const affected = await sql`
    SELECT id, stage, registration_number, commission_due_date, commission_status
    FROM car_sales_leads
    WHERE stage <> 'Released'
      AND commission_due_date IS NOT NULL
    ORDER BY commission_due_date
  `;

  console.log(`Found ${affected.length} unreleased lead(s) with a commission due date.\n`);
  affected.forEach((r, i) => {
    console.log(
      `  ${i + 1}. [${r.stage}] ${r.registration_number} — due ${r.commission_due_date} (${r.commission_status})`
    );
  });

  if (affected.length === 0) {
    console.log("\n✅ Nothing to clean up.");
    return;
  }

  if (!apply) {
    console.log(`\nℹ️  Dry run. Re-run with --apply to clear these ${affected.length} record(s).`);
    return;
  }

  const result = await sql`
    UPDATE car_sales_leads
    SET commission_due_date = NULL,
        commission_status   = 'Pending'
    WHERE stage <> 'Released'
      AND commission_due_date IS NOT NULL
  `;

  console.log(`\n✅ Cleared commission due date on ${result.length ?? affected.length} unreleased lead(s).`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Failed:", err);
    process.exit(1);
  });
