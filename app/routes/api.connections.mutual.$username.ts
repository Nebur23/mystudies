import { eq, and, count, desc, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "~/db";
import { userConnection, studentProfile } from "~/db/schema/social";
import { getSessionSafe } from "~/lib/auth";
import type { Route } from "./+types/api.connections.mutual.$username";

export async function loader({ params, request }: Route.LoaderArgs) {
  const { username } = params;

  const session = await getSessionSafe(request);

  if (!session?.user) {
    return {
      count: 0,
      previews: [],
    };
  }

  // Find viewed profile
  const targetProfile = await db.query.studentProfile.findFirst({
    where: eq(studentProfile.username, username),
    columns: {
      userId: true,
    },
  });

  if (!targetProfile) {
    return Response.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  // Prevent querying self profile mutuals
  if (targetProfile.userId === session.user.id) {
    return {
      count: 0,
      previews: [],
    };
  }

  // Table aliases
  const uc2 = alias(userConnection, "uc2");
  const sp = alias(studentProfile, "sp");

  /**
   * QUERY 1
   * Count mutual followings
   */
  const [mutualCountResult] = await db
    .select({
      count: count(),
    })
    .from(userConnection)
    .innerJoin(
      uc2,
      and(
        eq(userConnection.followingId, uc2.followingId),
        eq(userConnection.status, "accepted"),
        eq(uc2.status, "accepted")
      )
    )
    .where(
      and(
        eq(userConnection.followerId, session.user.id),
        eq(uc2.followerId, targetProfile.userId),

        // Safety exclusions
        ne(userConnection.followingId, session.user.id),
        ne(userConnection.followingId, targetProfile.userId)
      )
    );

  /**
   * QUERY 2
   * Fetch only 3 preview users
   */
  const previews = await db
    .select({
      userId: sp.userId,
      username: sp.username,
      displayName: sp.displayName,
      avatarUrl: sp.avatarUrl,
    })
    .from(userConnection)
    .innerJoin(
      uc2,
      and(
        eq(userConnection.followingId, uc2.followingId),
        eq(userConnection.status, "accepted"),
        eq(uc2.status, "accepted")
      )
    )
    .innerJoin(
      sp,
      eq(sp.userId, userConnection.followingId)
    )
    .where(
      and(
        eq(userConnection.followerId, session.user.id),
        eq(uc2.followerId, targetProfile.userId),

        // Safety exclusions
        ne(userConnection.followingId, session.user.id),
        ne(userConnection.followingId, targetProfile.userId)
      )
    )
    .orderBy(desc(sp.lastActiveAt))
    .limit(3);

    //console.log("Mutual Connections Previews:", previews);
    //console.log("Mutual Connections Count:", mutualCountResult?.count);

  return {
    count: Number(mutualCountResult?.count ?? 0),
    previews,
  };
}