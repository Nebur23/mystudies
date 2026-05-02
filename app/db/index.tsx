import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from "~/db/schema"; // your drizzle schema


const connectionString  = process.env.DATABASE_URL as string

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString as string, { prepare: false })
export const db = drizzle(client, { schema });

