#!/usr/bin/env node
/**
 * Adds the two liability insurance types and their benefit options.
 *
 *   Carrier's Liability   → benefits: Annual Carry, Per Carry
 *   Professional Indemnity → benefits: Annual Limit, Single Limit
 *
 * Benefit amounts for these covers are NOT derived from the sum insured —
 * they are typed in manually (calc_config type "fixed_editable", default 0).
 *
 * The script is additive and idempotent: it only ever adds new enum values and
 * new benefit_options rows. Existing enum values, benefits and policies are
 * left exactly as they are.
 *
 * Usage:
 *   node scripts/migrate-liability-types.mjs
 */

import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL not found (looked in .env.local).");
  process.exit(1);
}

const NEW_TYPES = ["Carriers Liability", "Professional Indemnity"];

const NEW_BENEFITS = [
  { name: "Annual Carry",  applicableTo: "carriers_liability",     sortOrder: 1 },
  { name: "Per Carry",     applicableTo: "carriers_liability",     sortOrder: 2 },
  { name: "Annual Limit",  applicableTo: "professional_indemnity", sortOrder: 1 },
  { name: "Single Limit",  applicableTo: "professional_indemnity", sortOrder: 2 },
];

// Manual entry — the user types the KES amount, no percentage calculation
const CALC_CONFIG = JSON.stringify({ type: "fixed_editable", defaultAmount: 0 });

async function run() {
  const sql = neon(process.env.DATABASE_URL);

  // 1. Insurance type enum values
  for (const t of NEW_TYPES) {
    await sql.query(
      `ALTER TYPE "insurance_type" ADD VALUE IF NOT EXISTS '${t.replace(/'/g, "''")}'`
    );
    console.log(`✓ insurance_type value ready: ${t}`);
  }

  // 2. Benefit options (skip any that already exist for that group)
  for (const b of NEW_BENEFITS) {
    const rows = await sql.query(
      `INSERT INTO "benefit_options" (name, is_active, sort_order, applicable_to, calc_config)
       SELECT $1::varchar, true, $2::integer, $3::varchar, $4::jsonb
       WHERE NOT EXISTS (
         SELECT 1 FROM "benefit_options" WHERE name = $1::varchar AND applicable_to = $3::varchar
       )
       RETURNING id`,
      [b.name, b.sortOrder, b.applicableTo, CALC_CONFIG]
    );
    console.log(
      rows.length
        ? `✓ added benefit: ${b.name} (${b.applicableTo})`
        : `• benefit already present: ${b.name} (${b.applicableTo})`
    );
  }

  const check = await sql.query(
    `SELECT name, applicable_to, calc_config FROM "benefit_options"
      WHERE applicable_to IN ('carriers_liability', 'professional_indemnity')
      ORDER BY applicable_to, sort_order`
  );
  console.log("\nLiability benefits now configured:");
  check.forEach((r) =>
    console.log(`  ${r.applicable_to.padEnd(24)} ${r.name}  ${JSON.stringify(r.calc_config)}`)
  );
}

run().catch((err) => { console.error(err); process.exit(1); });
