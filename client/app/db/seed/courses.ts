import { db } from "~/db";
import { course, courseModule, courseLesson } from "~/db/schema/courses";
import { studentProfile } from "~/db/schema/social";

export async function seedTestCourses() {
  console.log("🌱 Seeding test courses...");

  // 1. Create a test course
  const [calculus] = await db.insert(course).values({
    title: "Calculus: Differential & Integral",
    slug: "calculus-differential-integral",
    description: "Master calculus for GCE A-Level Mathematics. Covers limits, derivatives, integrals, and applications.",
    thumbnailUrl: "https://img.youtube.com/vi/WUvTyaaNkzM/maxresdefault.jpg",
    level: "alevel",
    subject: "Mathematics",
    isPublished: true,
  }).returning();

  // 2. Create modules
  const [limitsMod, derivativesMod] = await db.insert(courseModule).values([
    { courseId: calculus.id, title: "Module 1: Limits & Continuity", order: 1 },
    { courseId: calculus.id, title: "Module 2: Derivatives", order: 2 },
  ]).returning();

  // 3. Create lessons with real YouTube video IDs (GCE-relevant content)
  await db.insert(courseLesson).values([
    // Module 1: Limits
    {
      moduleId: limitsMod.id,
      title: "1.1 Introduction to Limits",
      youtubeVideoId: "WUvTyaaNkzM", // Khan Academy: Intro to limits
      duration: 600, // 10 min
      order: 1,
    },
    {
      moduleId: limitsMod.id,
      title: "1.2 One-Sided Limits",
      youtubeVideoId: "cn1IzrBNd8k", // Khan Academy: One-sided limits
      duration: 480,
      order: 2,
    },
    {
      moduleId: limitsMod.id,
      title: "1.3 Continuity",
      youtubeVideoId: "TGl9nZ0VfLs", // Khan Academy: Continuity
      duration: 540,
      order: 3,
    },
    // Module 2: Derivatives
    {
      moduleId: derivativesMod.id,
      title: "2.1 Definition of Derivative",
      youtubeVideoId: "S0_qX4VJhMQ", // Khan Academy: Derivative definition
      duration: 720,
      order: 1,
    },
    {
      moduleId: derivativesMod.id,
      title: "2.2 Power Rule",
      youtubeVideoId: "H-ybCx8gt-8", // Khan Academy: Power rule
      duration: 420,
      order: 2,
    },
  ]);

  console.log("✅ Seeded: Calculus course with 2 modules, 5 lessons");
}

// Also seed a test student profile if needed
export async function seedTestUser(userId: string) {
  await db.insert(studentProfile).values({
    userId,
    level: "alevel",
    displayName: "Test Student",
    username: "test_student_cm",
    isPublic: true,
    subjects: ["Mathematics", "Physics"],
    region: "northwest",
  }).onConflictDoNothing();
  
  console.log(`✅ Seeded profile for user: ${userId}`);
}

