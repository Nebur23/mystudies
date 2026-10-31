import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from "~/db/schema"; // your drizzle schema


const rawConnectionString = process.env.DATABASE_URL?.trim();
const connectionString = rawConnectionString?.replace(/^(['"])(.*)\1$/, "$2");

if (!connectionString) {
  throw new Error("DATABASE_URL must be set to a valid PostgreSQL URL.");
}

let databaseUrl: URL;
try {
  databaseUrl = new URL(connectionString);
} catch {
  throw new Error("DATABASE_URL must be set to a valid PostgreSQL URL.");
}

if (databaseUrl.protocol !== "postgres:" && databaseUrl.protocol !== "postgresql:") {
  throw new Error("DATABASE_URL must use the postgres:// or postgresql:// protocol.");
}

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });