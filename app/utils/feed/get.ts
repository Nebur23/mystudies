import { sql, eq, and, or, inArray, desc, ne } from "drizzle-orm";
import { db } from "~/db";
import { studyActivity, studentProfile, userConnection } from "~/db/schema/social";
import { getSessionSafe } from "~/lib/auth";

export async function getFeeds({ request }: { request: Request }) {
  const url = new URL(request.url);
  const session = await getSessionSafe(request);
  const cursor = url.searchParams.get("cursor");
  const limit = 20;

  // ── Step 1: resolve the social graph for logged-in users ──────────────────
  // Fetch both directions in one query:
  //   - people this user follows (following)     → see connections_only posts
  //   - people who follow this user (followers)  → also see their connections_only posts
  //     because "connections_only" means mutual awareness, not strict mutual-follow
  let socialGraphIds: string[] = [];

  if (session?.user) {
    const connections = await db
      .select({
        followerId:  userConnection.followerId,
        followingId: userConnection.followingId,
      })
      .from(userConnection)
      .where(
        and(
          eq(userConnection.status, "accepted"),
          or(
            eq(userConnection.followerId,  session.user.id), // people I follow
            eq(userConnection.followingId, session.user.id), // people who follow me
          )
        )
      );

    // Collect all unique peer IDs (exclude self)
    const peerSet = new Set<string>();
    for (const c of connections) {
      if (c.followerId  !== session.user.id) peerSet.add(c.followerId);
      if (c.followingId !== session.user.id) peerSet.add(c.followingId);
    }
    socialGraphIds = [...peerSet];
  }

  // ── Step 2: build visibility filter ───────────────────────────────────────
  //
  // Logged-out: public only
  // Logged-in:
  //   • public activities from anyone
  //   • connections_only from peers (followers + following)
  //   • everything from self (including private)
  //
  const visibilityFilter = session?.user
    ? or(
        // Public from anyone (excluding own — covered below to avoid dups)
        and(
          eq(studyActivity.visibility, "public"),
          ne(studyActivity.userId, session.user.id)
        ),
        // Connections_only from social graph peers
        ...(socialGraphIds.length > 0
          ? [
              and(
                inArray(studyActivity.userId, socialGraphIds),
                or(
                  eq(studyActivity.visibility, "public"),
                  eq(studyActivity.visibility, "connections_only")
                )
              ),
            ]
          : []),
        // Own activities — all visibility levels
        eq(studyActivity.userId, session.user.id)
      )
    : eq(studyActivity.visibility, "public"); // logged-out: public only

  // ── Step 3: cursor pagination ─────────────────────────────────────────────
  const cursorCondition = cursor
    ? sql`${studyActivity.createdAt} < ${new Date(cursor)}`
    : undefined;

  // ── Step 4: main query ────────────────────────────────────────────────────
  const rows = await db
    .select({
      // Activity fields
      id:            studyActivity.id,
      userId:        studyActivity.userId,
      type:          studyActivity.type,
      content:       studyActivity.content,
      visibility:    studyActivity.visibility,
      likesCount:    studyActivity.likesCount,
      commentsCount: studyActivity.commentsCount,
      createdAt:     studyActivity.createdAt,
      // Author profile fields
      displayName: studentProfile.displayName,
      username:    studentProfile.username,
      avatarUrl:   studentProfile.avatarUrl,
      level:       studentProfile.level,
      // Like status — subquery is safe here; hits activity_like_unique index
      isLiked: session?.user
        ? sql<boolean>`EXISTS (
            SELECT 1 FROM activity_like
            WHERE activity_id = ${studyActivity.id}
              AND user_id     = ${session.user.id}
          )`
        : sql<boolean>`false`,
      // Expose whether this post is from a connection (useful for UI badges)
      isFromConnection: session?.user && socialGraphIds.length > 0
        ? sql<boolean>`${studyActivity.userId} = ANY(ARRAY[${sql.join(
            socialGraphIds.map(id => sql`${id}`), sql`, `
          )}]::text[])`
        : sql<boolean>`false`,
    })
    .from(studyActivity)
    .innerJoin(studentProfile, eq(studentProfile.userId, studyActivity.userId))
    .where(
      and(
        visibilityFilter,
        cursorCondition,
      )
    )
    .orderBy(desc(studyActivity.createdAt))
    .limit(limit + 1); // +1 to detect next page

  // ── Step 5: paginate ──────────────────────────────────────────────────────
  const hasNextPage = rows.length > limit;
  const pageItems   = hasNextPage ? rows.slice(0, -1) : rows;
  const nextCursor  = hasNextPage
    ? pageItems[pageItems.length - 1]?.createdAt.toISOString()
    : null;

  return { activities: pageItems, nextCursor, hasNextPage };
}

// ── Visibility guard for single-activity endpoints ────────────────────────────
// Use this in your activity detail / comment loaders
export async function checkActivityVisibility(
  activityId:      string,
  viewerId:        string | null,
  activityOwnerId: string
): Promise<boolean> {
  const activity = await db.query.studyActivity.findFirst({
    where:   eq(studyActivity.id, activityId),
    columns: { visibility: true },
  });

  if (!activity) return false;
  if (activity.visibility === "public")  return true;
  if (!viewerId)                          return false; // logged-out, non-public
  if (viewerId === activityOwnerId)       return true;  // always see own
  if (activity.visibility === "private") return false;

  // connections_only — accept either follow direction
  const connection = await db.query.userConnection.findFirst({
    where: and(
      or(
        and(
          eq(userConnection.followerId,  viewerId),
          eq(userConnection.followingId, activityOwnerId)
        ),
        and(
          eq(userConnection.followerId,  activityOwnerId),
          eq(userConnection.followingId, viewerId)
        )
      ),
      eq(userConnection.status, "accepted")
    ),
  });

  return !!connection;
}