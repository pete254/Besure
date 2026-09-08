#!/usr/bin/env node
/**
 * Adds the COMESA (Yellow Card) benefit option for motor covers.
 *
 * It is scoped to "both", the motor-wide group, so it shows on private,
 * commercial and commercial third party quotes and policies alike.
 *
 * The premium is a tariff figure that depends on the vehicle class and the
 * cover period, so it is typed in manually (calc_config "fixed_editable")
 * rather than derived from the sum insured.
 *
 * Idempotent: it inserts the row if it is missing, and re-scopes an earlier
 * COMESA row that was created against a single motor group. No other benefit,
 * policy or enum value is touched.
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
const APPLICABLE_TO = "both"; // motor-wide: private + commercial + third party
const CALC_CONFIG = JSON.stringify({ type: "fixed_editable", defaultAmount: 0 });

async function run() {
  const sql = neon(process.env.DATABASE_URL);

  // An earlier run scoped COMESA to one motor group — widen it in place so the
  // benefit keeps its id and any policies already referencing it
  const rescoped = await sql.query(
    `UPDATE "benefit_options" SET applicable_to = $1::varchar
      WHERE name = $2::varchar AND applicable_to IN ('private', 'commercial')
      RETURNING id, applicable_to`,
    [APPLICABLE_TO, NAME]
  );
  if (rescoped.length) console.log(`✓ re-scoped ${rescoped.length} existing ${NAME} row(s) to ${APPLICABLE_TO}`);

  // Place it after the existing motor-wide benefits
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
    `SELECT name, applicable_to, is_active, sort_order, calc_config FROM "benefit_options"
      WHERE name = $1::varchar ORDER BY applicable_to`,
    [NAME]
  );
  console.log(`\n${NAME} rows now configured:`);
  check.forEach((r) =>
    console.log(`  ${r.is_active ? "✔" : "✖"} ${String(r.applicable_to).padEnd(12)} sort ${r.sort_order}  ${JSON.stringify(r.calc_config)}`)
  );
}

run().catch((err) => { console.error(err); process.exit(1); });
