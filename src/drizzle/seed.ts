// BeSure Insurance Solutions — Database Seed
// Run: npx tsx drizzle/seed.ts
// Seeds: insurers, benefit options, default admin user
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "./schema";
import { eq, inArray } from "drizzle-orm";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool, { schema });

async function seed() {
  console.log("🌱 Seeding BeSure database...\n");

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

  // Deactivate old/unwanted benefits instead of deleting (due to foreign keys)
  await db
    .update(schema.benefitOptions)
    .set({ isActive: false })
    .where(inArray(schema.benefitOptions.name, ["Courtesy Car", "Loss of Use / Courtesy car"]));
  console.log("Deactivated old benefits");

  const benefitData: schema.NewBenefitOption[] = [
    { name: "Anti-Violence / Political Violence Cover", isActive: true, sortOrder: 2 },
    { name: "Excess Protector", isActive: true, sortOrder: 3 },
    { name: "Windscreen Cover", isActive: true, sortOrder: 4 },
    { name: "Personal Accident - Driver", isActive: true, sortOrder: 5 },
    { name: "Personal Accident - Passengers", isActive: true, sortOrder: 6 },
    { name: "Medical Expenses Extension", isActive: true, sortOrder: 7 },
    { name: "Loss of Use / Car Hire", isActive: true, sortOrder: 8 },
    { name: "Third Party Property Damage Increase", isActive: true, sortOrder: 9 },
    { name: "Riot & Strike Cover", isActive: true, sortOrder: 10 },
  ];

  for (const benefit of benefitData) {
    const existing = await db
      .select()
      .from(schema.benefitOptions)
      .where(eq(schema.benefitOptions.name, benefit.name));

    if (existing.length === 0) {
      await db.insert(schema.benefitOptions).values(benefit);
      console.log(`  ✅ ${benefit.name}`);
    } else {
      console.log(`  ⏭️  ${benefit.name} already exists`);
    }
  }

  // ─── DEFAULT ADMIN USER ─────────────────────────────────────
  // ⚠️  CHANGE password after first login!
  // Password is hashed with bcrypt — replace hash below with:
  // import { hash } from "bcryptjs"; const hash = await hash("yourpassword", 12);
  console.log("\nSeeding default admin user...");

  const adminEmail = "admin@besure.co.ke";
  const existingAdmin = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, adminEmail));

  if (existingAdmin.length === 0) {
    // Default password: BeSure2025! — CHANGE IMMEDIATELY after first login
    // This is a bcrypt hash of "BeSure2025!"
    await db.insert(schema.users).values({
      name: "System Admin",
      email: adminEmail,
      passwordHash: "$2b$12$IX3OR3mLj0aAfwUzFJE1Guyv/FgRbWjV8M8x9NW9a6VqaoiUyFw7y",
      role: "admin",
      isActive: true,
    });
    console.log("  ✅ Admin user created: admin@besure.co.ke");
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
