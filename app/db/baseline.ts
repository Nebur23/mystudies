import postgres from "postgres";
import { readdir } from "fs/promises";
import { join } from "path";

const DATABASE_URL = process.env.DATABASE_URL!;

async function baseline() {
  const sql = postgres(DATABASE_URL, { max: 1 });

  // Ensure drizzle schema and migrations table exist
  await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;
  await sql`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id serial PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `;

  // Read all generated migration files
  const migrationsDir = join(process.cwd(), "app/db/migrations");
  const metaPath = join(migrationsDir, "meta/_journal.json");

  const journal = JSON.parse(
    await Bun.file(metaPath).text()
  ) as { entries: { idx: number; when: number; tag: string; breakpoints: boolean }[] };

  for (const entry of journal.entries) {
    const hash = entry.tag; // drizzle uses the tag as the hash key

    const [{ count }] = await sql`
      SELECT count(*)::int AS count
      FROM drizzle.__drizzle_migrations
      WHERE hash = ${hash}
    `;

    if (count > 0) {
      console.log(`  ⏭  ${hash} (already baselined)`);
      continue;
    }

    // Insert without executing — marks it as done
    await sql`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES (${hash}, ${entry.when})
    `;
    console.log(`  ✓  Baselined: ${hash}`);
  }

  console.log("✓ Baseline complete — Drizzle now knows your existing schema.");
  await sql.end();
}

baseline().catch((err) => {
  console.error("Baseline failed:", err);
  process.exit(1);
});