import { eq, sql } from "drizzle-orm";
import { db } from "~/db";
import { studyActivity, studentProfile } from "~/db/schema/social";
import { requireAuth } from "~/lib/auth.server";
import { z } from "zod";
import type { Route } from "./+types/api.feed.create";

const createActivitySchema = z.object({
  type: z.enum([
    "quiz_completed", "badge_earned", "streak_milestone",
    "leaderboard_rank", "subject_enrolled", "study_session_started",
    "note_shared", "question_asked", "profile_updated",
  ]),
  content: z.record(z.string(), z.unknown()),  // ✅ z.record() takes ONE type arg (value type)
  visibility: z.enum(["public", "connections_only", "private"]).default("public"),
});

export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuth(request);
  const formData = await request.formData();

  const rawData = {
    type: formData.get("type"),
    content: JSON.parse((formData.get("content") as string) || "{}"),
    visibility: formData.get("visibility"),
  };

  const validated = createActivitySchema.safeParse(rawData);
  if (!validated.success) {
    return Response.json(
      { error: "Invalid activity data", details: validated.error.flatten() },
      { status: 400 }
    );
  }

  const { type, content, visibility } = validated.data;

  // Type-specific validation
  if (type === "quiz_completed") {
    if (!content.quizId || !content.subject || typeof content.score !== "number") {
      return Response.json(
        { error: "Missing required fields for quiz_completed" },
        { status: 400 }
      );
    }
  }

  const [newActivity] = await db
    .insert(studyActivity)
    .values({ userId: session.user.id, type, content, visibility, createdAt: new Date() })
    .returning();

  const profile = await db.query.studentProfile.findFirst({
    where: eq(studentProfile.userId, session.user.id),
    columns: { displayName: true, username: true, avatarUrl: true, level: true },
  });

  // ✅ NOTIFY payload must be injected as a raw string literal, not a parameter.
  // Drizzle's ${} interpolation sends values as $1, $2 placeholders which
  // PostgreSQL NOTIFY does not accept — it requires a literal string.
  const notifyPayload = JSON.stringify({
    activityId: newActivity.id,
    activityUserId: session.user.id,
  }).replace(/'/g, "''"); // escape single quotes for SQL string literal

  await db.execute(
    sql.raw(`NOTIFY new_study_activity, '${notifyPayload}'`)
  );

  

  return {
    success: true,
    activity: {
      ...newActivity,
      createdAt: newActivity.createdAt.toISOString(),
      displayName: profile?.displayName ?? null,
      username: profile?.username ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
      level: profile?.level ?? null,
      isLiked: false,
      isFromConnection: false,
      likesCount: 0,
      commentsCount: 0,
    },
  };
}
