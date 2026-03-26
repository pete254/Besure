// src/lib/db.ts
// Single shared Drizzle + Neon client instance
// Import { db } from "@/lib/db" in all API routes and server components

import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "@/drizzle/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, { schema });

export type DB = typeof db;