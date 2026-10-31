import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

const DATABASE_URL = process.env.DATABASE_URL!;

async function runMigrations() {
  const sql = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(sql);

  console.log("▶ Running Drizzle structural migrations...");
  await migrate(db, { migrationsFolder: "./app/db/migrations" });
  console.log("✓ Drizzle migrations done");

  console.log("▶ Running manual SQL migrations...");
  await runManualMigrations(sql);
  console.log("✓ Manual migrations done");

  await sql.end();
}

async function runManualMigrations(sql: postgres.Sql) {
  // Tracking table so manual migrations run only once
  await sql`
    CREATE TABLE IF NOT EXISTS manual_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  const dir = join(process.cwd(), "app/db/migrations-manual");
  const files = (await readdir(dir))
    .filter(f => f.endsWith(".sql"))
    .sort(); // 001_, 002_, 003_ ordering

  for (const file of files) {
    const [{ count }] = await sql`
      SELECT count(*)::int AS count FROM manual_migrations WHERE filename = ${file}
    `;
    if (count > 0) {
      console.log(`  ⏭  ${file} (already applied)`);
      continue;
    }

    console.log(`  ▶  Applying ${file}...`);
    const sqlContent = await readFile(join(dir, file), "utf-8");
    await sql.unsafe(sqlContent);
    await sql`INSERT INTO manual_migrations (filename) VALUES (${file})`;
    console.log(`  ✓  ${file} applied`);
  }
}

runMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});