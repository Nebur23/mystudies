import { eq, and, sql } from "drizzle-orm";
import { db } from "~/db";
import { userLessonProgress, courseLesson } from "~/db/schema/courses";
import { requireAuth } from "~/lib/auth";
import type { Route } from "./+types/api.courses.progress";

export async function action({ request }: Route.ActionArgs) {
  const session  = await requireAuth(request);
  const formData = await request.formData();

  const lessonId      = formData.get("lessonId") as string;
  const watchedRaw    = formData.get("watchedSeconds") as string;
  const completedRaw  = formData.get("completed") as string;

  // Validation
  if (!lessonId) {
    return Response.json({ error: "Missing lessonId" }, { status: 400 });
  }
  const watchedSeconds = parseInt(watchedRaw, 10);
  if (isNaN(watchedSeconds) || watchedSeconds < 0) {
    return Response.json({ error: "Invalid watchedSeconds" }, { status: 400 });
  }
  const completed = completedRaw === "true";

  // ✅ Verify lesson exists (prevents arbitrary lessonId injection)
  const lesson = await db.query.courseLesson.findFirst({
    where: eq(courseLesson.id, lessonId),
    columns: { id: true },
  });
  if (!lesson) {
    return Response.json({ error: "Lesson not found" }, { status: 404 });
  }

  await db
    .insert(userLessonProgress)
    .values({
      userId:        session.user.id,
      lessonId,
      watchedSeconds,
      completed,
      lastWatchedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [userLessonProgress.userId, userLessonProgress.lessonId],
      set: {
        // Never decrease watched seconds (handles seek-back)
        watchedSeconds: sql`GREATEST(user_lesson_progress.watched_seconds, ${watchedSeconds})`,
        // Completion is sticky — once true, stays true
        completed:      sql`user_lesson_progress.completed OR ${completed}`,
        lastWatchedAt:  new Date(),
      },
    });

  return Response.json({ success: true });
}