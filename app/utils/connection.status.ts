import { eq, and, or } from "drizzle-orm";
import { db } from "~/db";
import { studentProfile, userConnection } from "~/db/schema/social";
import { getSessionSafe } from "~/lib/auth.server";

export async function ConnectionStatus({ params, request }: { params: { username: string }, request: Request }) {
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
    where: or(
      // Current user sent request to target profile
      and(
        eq(userConnection.followerId, session.user.id),
        eq(userConnection.followingId, targetProfile.userId)
      ),

      // Target profile sent request to current user
      and(
        eq(userConnection.followerId, targetProfile.userId),
        eq(userConnection.followingId, session.user.id)
      )
    )
  });

  let direction: "incoming" | "outgoing" | null = null;

  if (connection) {
    if (connection.followerId === session.user.id) {
      direction = "outgoing";
    } else {
      direction = "incoming";
    }
  }

  // Determine UI state
  let status: "none" | "pending" | "accepted" | "blocked" | "rejected";
  let canConnect = false;

  if (!connection) {
    status = "none";
    canConnect = targetProfile.allowFriendRequests !== false;
  } else {
    status = connection.status;
    canConnect = false; // Already have a connection state
    direction;
  }

  console.log("Connection Status:", { status, canConnect,direction });

  return {
    status,
    direction,
    canConnect,
    targetUserId: targetProfile.userId,
  };
}
