import { db } from "~/db";
import { resourceCategory } from "~/db/schema/library";
import { eq } from "drizzle-orm";

const CATEGORIES = [
  {
    name:        "Past Papers",
    slug:        "past-papers",
    description: "Official GCE past examination papers for O-Level and A-Level subjects.",
    icon:        "📝",
    order:       1,
  },
  {
    name:        "Marking Schemes",
    slug:        "marking-schemes",
    description: "Official examiner marking schemes and model answers for past papers.",
    icon:        "✅",
    order:       2,
  },
  {
    name:        "Textbooks",
    slug:        "textbooks",
    description: "Recommended textbooks and reference materials for GCE subjects.",
    icon:        "📚",
    order:       3,
  },
  {
    name:        "Study Guides",
    slug:        "study-guides",
    description: "Revision notes, summaries, and condensed study materials.",
    icon:        "📖",
    order:       4,
  },
  {
    name:        "Practice Questions",
    slug:        "practice-questions",
    description: "Topic-specific exercise sets and drill questions with answer keys.",
    icon:        "✏️",
    order:       5,
  },
  {
    name:        "Syllabus & Specs",
    slug:        "syllabus",
    description: "Official GCE syllabus documents and subject specifications.",
    icon:        "📋",
    order:       6,
  },
  {
    name:        "Pamphlets",
    slug:        "pamphlets",
    description: "Short topic pamphlets, formula sheets, and quick-reference cards.",
    icon:        "🗒️",
    order:       7,
  },
] as const;

export async function seedCategories() {
  console.log("▶ Seeding library categories…");

  let inserted = 0;
  let skipped  = 0;

  for (const cat of CATEGORIES) {
    // Idempotent — skip if slug already exists
    const existing = await db.query.resourceCategory.findFirst({
      where: eq(resourceCategory.slug, cat.slug),
      columns: { id: true },
    });

    if (existing) {
      console.log(`  ⏭  "${cat.name}" already exists — skipping`);
      skipped++;
      continue;
    }

    await db.insert(resourceCategory).values({
      name:        cat.name,
      slug:        cat.slug,
      description: cat.description,
      icon:        cat.icon,
      order:       cat.order,
    });

    console.log(`  ✓  Inserted "${cat.name}"`);
    inserted++;
  }

  console.log(`\n✓ Done — ${inserted} inserted, ${skipped} skipped.\n`);
}

