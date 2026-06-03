import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { Pool } from "@neondatabase/serverless";

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const client = await pool.connect();
  try {
    await client.query(`ALTER TABLE "insurers" ADD COLUMN IF NOT EXISTS "rate_medical" numeric(5,2)`);
    console.log("Column rate_medical added (or already existed)");
    const r = await client.query(
      `UPDATE "insurers" SET "rate_medical" = 10.00 WHERE "rate_medical" IS NULL RETURNING name, rate_medical`
    );
    if (r.rows.length > 0) {
      console.log("Set rate_medical = 10% for:", r.rows.map((x: any) => x.name).join(", "));
    } else {
      console.log("All insurers already have rate_medical set.");
    }
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => { console.error(err); process.exit(1); });
