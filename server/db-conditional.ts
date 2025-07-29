import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "@shared/schema";

let db: any = null;
let pool: any = null;

export function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
    console.log("No DATABASE_URL set, using in-memory storage");
    return { db: null, pool: null };
  }

  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle(pool, { schema });
    console.log("Database initialized successfully");
    return { db, pool };
  } catch (error) {
    console.error("Failed to initialize database:", error);
    console.log("Falling back to in-memory storage");
    return { db: null, pool: null };
  }
}

export function getDb() {
  return db;
}

export function getPool() {
  return pool;
} 