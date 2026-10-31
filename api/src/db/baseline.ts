import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to baseline migrations.");
}

async function baseline(): Promise<void> {
  const pool = new Pool({ connectionString: databaseUrl, max: 1 });

  try {
    await pool.query("CREATE SCHEMA IF NOT EXISTS drizzle");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id serial PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `);

    const migrationsDir = join(process.cwd(), "src/db/migrations");
    const metaPath = join(migrationsDir, "meta/_journal.json");
    const journal = JSON.parse(await readFile(metaPath, "utf8")) as {
      entries: { idx: number; when: number; tag: string; breakpoints: boolean }[];
    };

    for (const entry of journal.entries) {
      const result = await pool.query<{ count: number }>(
        "SELECT count(*)::int AS count FROM drizzle.__drizzle_migrations WHERE hash = $1",
        [entry.tag],
      );

      if ((result.rows[0]?.count ?? 0) > 0) {
        console.log(`  ⏭  ${entry.tag} (already baselined)`);
        continue;
      }

      await pool.query(
        "INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)",
        [entry.tag, entry.when],
      );
      console.log(`  ✓  Baselined: ${entry.tag}`);
    }

    console.log("✓ Baseline complete — Drizzle now knows your existing schema.");
  } finally {
    await pool.end();
  }
}

baseline().catch((error: unknown) => {
  console.error("Baseline failed:", error);
  process.exitCode = 1;
});
