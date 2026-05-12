import { eq, and, sql, isNull } from "drizzle-orm";
import { db } from "~/db";
import { activityLike, activityComment, studyActivity, studentProfile } from "~/db/schema/social";
import { requireAuth } from "~/lib/auth";
import type { Route } from "./+types/api.feed.engagement";

// Single action handler — dispatches by "intent" field
export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  switch (intent) {
    case "like":    return handleLike(formData, session.user.id);
    case "comment": return handleComment(formData, session.user.id);
    default:
      return Response.json({ error: "Unknown intent" }, { status: 400 });
  }
}

// ── LIKE / UNLIKE ──────────────────────────────────────────────────────────────
async function handleLike(formData: FormData, userId: string) {
  const activityId = formData.get("activityId") as string;
  const action     = formData.get("action") as "add" | "remove";

  if (!activityId) {
    return Response.json({ error: "Missing activityId" }, { status: 400 });
  }

  if (action === "add") {
    try {
      await db.insert(activityLike).values({ activityId, userId });

      // Increment denormalized count
      await db
        .update(studyActivity)
        .set({ likesCount: sql`${studyActivity.likesCount} + 1` })
        .where(eq(studyActivity.id, activityId));

      return Response.json({ success: true, action: "liked" });
    } catch (e: any) {
      if (e.code === "23505") {
        // Unique violation — already liked, idempotent success
        return Response.json({ success: true, action: "already_liked" });
      }
      throw e;
    }
  } else {
    await db
      .delete(activityLike)
      .where(
        and(
          eq(activityLike.activityId, activityId),
          eq(activityLike.userId, userId)
        )
      );

    // Decrement — floor at 0
    await db
      .update(studyActivity)
      .set({ likesCount: sql`GREATEST(${studyActivity.likesCount} - 1, 0)` })
      .where(eq(studyActivity.id, activityId));

    return Response.json({ success: true, action: "unliked" });
  }
}

// ── ADD COMMENT ────────────────────────────────────────────────────────────────
async function handleComment(formData: FormData, userId: string) {
  const activityId = formData.get("activityId") as string;
  const content    = (formData.get("content") as string)?.trim();
  const parentId   = (formData.get("parentId") as string) || null;

  if (!activityId) {
    return Response.json({ error: "Missing activityId" }, { status: 400 });
  }
  if (!content) {
    return Response.json({ error: "Comment cannot be empty" }, { status: 400 });
  }

  const [newComment] = await db
    .insert(activityComment)
    .values({ activityId, userId, content, parentId: parentId ?? undefined })
    .returning();

  // Fetch commenter profile for immediate UI display
  const profile = await db.query.studentProfile.findFirst({
    where: eq(studentProfile.userId, userId),
    columns: { displayName: true, username: true, avatarUrl: true },
  });

  // Increment denormalized count
  await db
    .update(studyActivity)
    .set({ commentsCount: sql`${studyActivity.commentsCount} + 1` })
    .where(eq(studyActivity.id, activityId));

  return Response.json({
    success: true,
    comment: {
      ...newComment,
      displayName: profile?.displayName,
      username:    profile?.username,
      avatarUrl:   profile?.avatarUrl,
    },
  });
}

// ── LOAD COMMENTS (loader) ─────────────────────────────────────────────────────
export async function loader({ request }: Route.LoaderArgs) {
  const url        = new URL(request.url);
  const activityId = url.searchParams.get("activityId");
  const parentId   = url.searchParams.get("parentId");
  const cursor     = url.searchParams.get("cursor");
  const limit      = 10;

  if (!activityId) {
    return Response.json({ error: "Missing activityId" }, { status: 400 });
  }

  const comments = await db
    .select({
      id:          activityComment.id,
      content:     activityComment.content,
      createdAt:   activityComment.createdAt,
      userId:      activityComment.userId,
      parentId:    activityComment.parentId,
      displayName: studentProfile.displayName,
      username:    studentProfile.username,
      avatarUrl:   studentProfile.avatarUrl,
      // Inline reply count — only for top-level comments
      replyCount: sql<number>`(
        SELECT COUNT(*)::int FROM activity_comment ac2
        WHERE ac2.parent_id = ${activityComment.id}
      )`,
    })
    .from(activityComment)
    .innerJoin(studentProfile, eq(studentProfile.userId, activityComment.userId))
    .where(
      and(
        eq(activityComment.activityId, activityId),
        parentId
          ? eq(activityComment.parentId, parentId)
          : isNull(activityComment.parentId),         // top-level only
        cursor
          ? sql`${activityComment.createdAt} < ${new Date(cursor)}`
          : undefined
      )
    )
    .orderBy(sql`${activityComment.createdAt} DESC`)
    .limit(limit + 1);

  const hasNextPage = comments.length > limit;
  const pageItems   = hasNextPage ? comments.slice(0, -1) : comments;

  return Response.json({
    comments:    pageItems,
    hasNextPage,
    nextCursor:  hasNextPage ? pageItems[pageItems.length - 1]?.createdAt : null,
  });
}