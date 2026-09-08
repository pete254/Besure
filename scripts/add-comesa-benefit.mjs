#!/usr/bin/env node
/**
 * Adds the COMESA (Yellow Card) benefit option for commercial motor covers.
 *
 * The premium is a tariff figure that depends on the vehicle class and the
 * cover period, so it is typed in manually (calc_config "fixed_editable")
 * rather than derived from the sum insured.
 *
 * Additive and idempotent: it inserts one row and only if it is not already
 * there. Nothing existing is modified.
 *
 * Usage:
 *   node scripts/add-comesa-benefit.mjs
 */

import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL not found (looked in .env.local).");
  process.exit(1);
}

const NAME = "COMESA";
const APPLICABLE_TO = "commercial";
const CALC_CONFIG = JSON.stringify({ type: "fixed_editable", defaultAmount: 0 });

async function run() {
  const sql = neon(process.env.DATABASE_URL);

  // Place it after the existing commercial benefits
  const [{ next_order }] = await sql.query(
    `SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order
       FROM "benefit_options" WHERE applicable_to = $1::varchar`,
    [APPLICABLE_TO]
  );

  const rows = await sql.query(
    `INSERT INTO "benefit_options" (name, is_active, sort_order, applicable_to, calc_config)
     SELECT $1::varchar, true, $2::integer, $3::varchar, $4::jsonb
     WHERE NOT EXISTS (
       SELECT 1 FROM "benefit_options" WHERE name = $1::varchar AND applicable_to = $3::varchar
     )
     RETURNING id`,
    [NAME, next_order, APPLICABLE_TO, CALC_CONFIG]
  );

  console.log(
    rows.length
      ? `✓ added benefit: ${NAME} (${APPLICABLE_TO}, sort order ${next_order})`
      : `• benefit already present: ${NAME} (${APPLICABLE_TO})`
  );

  const check = await sql.query(
    `SELECT name, is_active, sort_order, calc_config FROM "benefit_options"
      WHERE applicable_to = $1::varchar ORDER BY sort_order, name`,
    [APPLICABLE_TO]
  );
  console.log("\nCommercial motor benefits now configured:");
  check.forEach((r) =>
    console.log(`  ${r.is_active ? "✔" : "✖"} ${String(r.sort_order).padStart(2)}  ${r.name.padEnd(26)} ${JSON.stringify(r.calc_config)}`)
  );
}

run().catch((err) => { console.error(err); process.exit(1); });
