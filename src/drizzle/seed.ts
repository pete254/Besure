// Myloe Insurance Agency — Database Seed v2.3
// Run: npx tsx src/drizzle/seed.ts
// Seeds: insurers, benefit options (per insurance type group), default admin user

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "./schema";
import { eq, and } from "drizzle-orm";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool, { schema });

async function seed() {
  console.log("🌱 Seeding Myloe database v2.3...\n");

  // ─── INSURERS ───────────────────────────────────────────────
  console.log("Seeding insurers...");

  const insurerData: schema.NewInsurer[] = [
    {
      name: "Jubilee Insurance",
      isActive: true,
      commissionRate: "12.50",
      rateMotorPrivate: "4.00",
      rateMotorCommercial: "4.50",
      ratePsv: "5.00",
      minPremiumPrivate: "7500.00",
      minPremiumCommercial: "10000.00",
      minPremiumPsv: "12000.00",
    },
    {
      name: "APA Insurance",
      isActive: true,
      commissionRate: "12.50",
      rateMotorPrivate: "3.75",
      rateMotorCommercial: "4.25",
      ratePsv: "4.75",
      minPremiumPrivate: "7500.00",
      minPremiumCommercial: "10000.00",
      minPremiumPsv: "12000.00",
    },
    {
      name: "Britam Insurance",
      isActive: true,
      commissionRate: "12.50",
      rateMotorPrivate: "4.00",
      rateMotorCommercial: "4.50",
      ratePsv: "5.00",
      minPremiumPrivate: "7500.00",
      minPremiumCommercial: "10000.00",
      minPremiumPsv: "12000.00",
    },
    {
      name: "CIC Insurance",
      isActive: true,
      commissionRate: "12.50",
      rateMotorPrivate: "3.50",
      rateMotorCommercial: "4.00",
      ratePsv: "4.50",
      minPremiumPrivate: "7000.00",
      minPremiumCommercial: "9500.00",
      minPremiumPsv: "11500.00",
    },
    {
      name: "AAR Insurance",
      isActive: true,
      commissionRate: "12.50",
      rateMotorPrivate: "4.00",
      rateMotorCommercial: "4.50",
      ratePsv: "5.00",
      minPremiumPrivate: "7500.00",
      minPremiumCommercial: "10000.00",
      minPremiumPsv: "12000.00",
    },
    {
      name: "Sanlam Insurance",
      isActive: true,
      commissionRate: "12.50",
      rateMotorPrivate: "4.00",
      rateMotorCommercial: "4.50",
      ratePsv: "5.00",
      minPremiumPrivate: "7500.00",
      minPremiumCommercial: "10000.00",
      minPremiumPsv: "12000.00",
    },
    {
      name: "GA Insurance",
      isActive: true,
      commissionRate: "12.50",
      rateMotorPrivate: "3.75",
      rateMotorCommercial: "4.25",
      ratePsv: "4.75",
      minPremiumPrivate: "7500.00",
      minPremiumCommercial: "10000.00",
      minPremiumPsv: "12000.00",
    },
  ];

  for (const insurer of insurerData) {
    const existing = await db
      .select()
      .from(schema.insurers)
      .where(eq(schema.insurers.name, insurer.name));

    if (existing.length === 0) {
      await db.insert(schema.insurers).values(insurer);
      console.log(`  ✅ ${insurer.name}`);
    } else {
      console.log(`  ⏭️  ${insurer.name} already exists`);
    }
  }

  // ─── BENEFIT OPTIONS ────────────────────────────────────────
  console.log("\nSeeding benefit options...");

  // First: deactivate ALL — then upsert by (name + applicableTo) key
  await db.update(schema.benefitOptions).set({ isActive: false });
  console.log("  Deactivated all existing benefits for clean re-seed");

  // Get all current benefits for dedup lookup
  const allExisting = await db.select().from(schema.benefitOptions);

  const benefitsToSeed: schema.NewBenefitOption[] = [
    // ── PRIVATE ──────────────────────────────────────────────
    {
      name: "Political Violence Cover",
      isActive: true,
      sortOrder: 1,
      applicableTo: "private",
      calcConfig: { type: "percentage", rate: 0.0025, label: "0.25% of sum insured" },
    },
    {
      name: "Excess Protector",
      isActive: true,
      sortOrder: 2,
      applicableTo: "private",
      calcConfig: { type: "percentage", rate: 0.0025, label: "0.25% of sum insured" },
    },
    {
      name: "Windscreen Cover",
      isActive: true,
      sortOrder: 3,
      applicableTo: "private",
      calcConfig: { type: "windscreen", defaultValue: 50000 },
    },
    {
      name: "Personal Accident",
      isActive: true,
      sortOrder: 4,
      applicableTo: "private",
      calcConfig: { type: "fixed", defaultAmount: 5000 },
    },
    {
      name: "Loss of Use / Car Hire",
      isActive: true,
      sortOrder: 5,
      applicableTo: "private",
      calcConfig: { type: "loss_of_use", tiers: { 10: 3000, 20: 6000, 30: 9000 } },
    },
    {
      name: "Infotainment Unit",
      isActive: true,
      sortOrder: 6,
      applicableTo: "private",
      calcConfig: { type: "infotainment", defaultValue: 50000 },
    },
    // ── COMMERCIAL ───────────────────────────────────────────
    {
      name: "Political Violence Cover",
      isActive: true,
      sortOrder: 1,
      applicableTo: "commercial",
      calcConfig: { type: "percentage", rate: 0.0035, label: "0.35% of sum insured" },
    },
    {
      name: "Excess Protector",
      isActive: true,
      sortOrder: 2,
      applicableTo: "commercial",
      calcConfig: { type: "percentage", rate: 0.005, label: "0.5% of sum insured" },
    },
    {
      name: "Windscreen Cover",
      isActive: true,
      sortOrder: 3,
      applicableTo: "commercial",
      calcConfig: { type: "windscreen", defaultValue: 50000 },
    },
    {
      name: "Personal Accident",
      isActive: true,
      sortOrder: 4,
      applicableTo: "commercial",
      calcConfig: { type: "fixed", defaultAmount: 5000 },
    },
    {
      name: "PLL",
      isActive: true,
      sortOrder: 5,
      applicableTo: "commercial",
      calcConfig: { type: "fixed_editable", defaultAmount: 1000 },
    },
    {
      name: "Entertainment Unit",
      isActive: true,
      sortOrder: 6,
      applicableTo: "commercial",
      calcConfig: { type: "entertainment", defaultValue: 50000 },
    },
  ];

  for (const benefit of benefitsToSeed) {
    // Match by BOTH name AND applicableTo — this is the dedup key
    const exactMatch = allExisting.find(
      (e) => e.name === benefit.name && (e as any).applicableTo === benefit.applicableTo
    );

    if (exactMatch) {
      await db
        .update(schema.benefitOptions)
        .set({
          isActive: true,
          sortOrder: benefit.sortOrder,
          calcConfig: benefit.calcConfig as any,
          updatedAt: new Date(),
        })
        .where(eq(schema.benefitOptions.id, exactMatch.id));
      console.log(`  ♻️  Updated: ${benefit.name} (${benefit.applicableTo})`);
    } else {
      await db.insert(schema.benefitOptions).values(benefit);
      console.log(`  ✅ Inserted: ${benefit.name} (${benefit.applicableTo})`);
    }
  }

  // ─── DEFAULT ADMIN USER ─────────────────────────────────────
  console.log("\nSeeding default admin user...");

  const adminEmail = "admin@myloe.co.ke";
  const existingAdmin = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, adminEmail));

  if (existingAdmin.length === 0) {
    await db.insert(schema.users).values({
      name: "System Admin",
      email: adminEmail,
      passwordHash: "$2b$12$IX3OR3mLj0aAfwUzFJE1Guyv/FgRbWjV8M8x9NW9a6VqaoiUyFw7y",
      role: "admin",
      isActive: true,
    });
    console.log("  ✅ Admin user created: admin@myloe.co.ke");
    console.log("  ⚠️  Update password hash before deploying to production!");
  } else {
    console.log("  ⏭️  Admin user already exists");
  }

  console.log("\n✨ Seed complete.");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});