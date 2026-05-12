import { eq, and } from "drizzle-orm";
import { db } from "~/db";
import { studentProfile, userConnection } from "~/db/schema/social";
import { getSessionSafe } from "~/lib/auth";
import type { Route } from "./+types/api.connections.status.$username";

export async function loader({ params, request }: Route.LoaderArgs) {
  const { username } = params;
  const session = await getSessionSafe(request);

  // If not authenticated, no connection possible
  if (!session?.user) {
    return Response.json({ status: "none", canConnect: false });
  }

  // Get target user's profile to check privacy
  const targetProfile = await db.query.studentProfile.findFirst({
    where: eq(studentProfile.username, username),
    columns: { userId: true, allowFriendRequests: true }
  });

  if (!targetProfile) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  // Check existing connection
  const connection = await db.query.userConnection.findFirst({
    where: and(
      eq(userConnection.followerId, session.user.id),
      eq(userConnection.followingId, targetProfile.userId)
    )
  });

  // Determine UI state
  let status: "none" | "pending" | "accepted" | "blocked" | "rejected";
  let canConnect = false;

  if (!connection) {
    status = "none";
    canConnect = targetProfile.allowFriendRequests !== false;
  } else {
    status = connection.status;
    canConnect = false; // Already have a connection state
  }

  return {
    status,
    canConnect,
    targetUserId: targetProfile.userId,
  };
}