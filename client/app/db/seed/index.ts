import { seedTestCourses } from "./courses";
import { seedCategories } from "./library-categories";

async function main() {
  try {
    // Run your course seeding
    //await seedTestCourses();
    await seedCategories();
    
    // If you want to seed a test user, you can pass an ID here
    // await seedTestUser("some-test-uid");

    console.log("✨ Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

main();