import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { Pool } from "@neondatabase/serverless";

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const client = await pool.connect();
  try {
    await client.query(`ALTER TABLE "insurers" ADD COLUMN IF NOT EXISTS "rate_medical" numeric(5,2)`);
    console.log("Column rate_medical added (or already existed)");
    const r1 = await client.query(
      `UPDATE "insurers" SET "rate_medical" = 10.00 WHERE "rate_medical" IS NULL RETURNING name`
    );
    if (r1.rows.length > 0) {
      console.log("Set rate_medical = 10% for:", r1.rows.map((x: any) => x.name).join(", "));
    } else {
      console.log("All insurers already have rate_medical set.");
    }

    await client.query(`ALTER TABLE "insurers" ADD COLUMN IF NOT EXISTS "commission_rate_medical" numeric(5,2)`);
    console.log("Column commission_rate_medical added (or already existed)");
    const r2 = await client.query(
      `UPDATE "insurers" SET "commission_rate_medical" = "commission_rate" WHERE "commission_rate_medical" IS NULL RETURNING name, commission_rate_medical`
    );
    if (r2.rows.length > 0) {
      console.log("Set commission_rate_medical for:", r2.rows.map((x: any) => `${x.name} → ${x.commission_rate_medical}%`).join(", "));
    } else {
      console.log("All insurers already have commission_rate_medical set.");
    }
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => { console.error(err); process.exit(1); });
