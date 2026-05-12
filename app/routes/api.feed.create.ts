import { eq, sql } from "drizzle-orm";
import { db } from "~/db";
import { studyActivity, studentProfile } from "~/db/schema/social";
import { requireAuth } from "~/lib/auth";
import { z } from "zod";
import type { Route } from "./+types/api.feed.create";

const createActivitySchema = z.object({
  type: z.enum([
    "quiz_completed", "badge_earned", "streak_milestone", 
    "leaderboard_rank", "subject_enrolled", "study_session_started",
    "note_shared", "question_asked", "profile_updated"
  ]),
  content: z.record(z.any(),z.unknown()), // Flexible, validated per type
  visibility: z.enum(["public", "connections_only", "private"]).default("public"),
});

export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuth(request);
  const formData = await request.formData();
  
  // Parse and validate
  const rawData = {
    type: formData.get("type"),
    content: JSON.parse(formData.get("content") as string || "{}"),
    visibility: formData.get("visibility"),
  };
  
  const validated = createActivitySchema.safeParse(rawData);
  if (!validated.success) {
    return Response.json({ error: "Invalid activity data", details: validated.error.flatten() }, { status: 400 });
  }
  
  console.log("feed post ",validated.data)

  const { type, content, visibility } = validated.data;
  
  // Type-specific content validation (example for quiz_completed)
  if (type === "quiz_completed") {
    if (!content.quizId || !content.subject || typeof content.score !== "number") {
      return Response.json({ error: "Missing required fields for quiz_completed" }, { status: 400 });
    }
  }
  
  // Create activity
  const [newActivity] = await db.insert(studyActivity)
    .values({
      userId: session.user.id,
      type,
      content,
      visibility,
      createdAt: new Date(),
    })
    .returning();
  
  // Fetch profile info for immediate response
  const profile = await db.query.studentProfile.findFirst({
    where: eq(studentProfile.userId, session.user.id),
    columns: { displayName: true, username: true, avatarUrl: true, level: true }
  });
  
  // Notify PostgreSQL listeners for SSE (real-time)
  await db.execute(sql`
    NOTIFY new_study_activity, ${JSON.stringify({
      activityId: newActivity.id,
      activityUserId: session.user.id,
    })}
  `);
  
  // TODO: Trigger notifications to followers (Phase 5)
  
  return {
    success: true,
    activity: {
      ...newActivity,
      displayName: profile?.displayName,
      username: profile?.username,
      avatarUrl: profile?.avatarUrl,
      level: profile?.level,
      isLiked: false,
      likesCount: 0,
      commentsCount: 0,
    },
  };
}