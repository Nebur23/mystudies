import { eq, and, sql } from "drizzle-orm";
import { db } from "~/db";
import { userConnection, studentProfile } from "~/db/schema/social";
import { requireAuth } from "~/lib/auth";
import { z } from "zod";
import type { Route } from "./+types/api.connections.action";
import { formatZodErrors } from "~/utils/zod";

const connectionActionSchema = z.object({
  action: z.enum(["send", "accept", "decline", "block", "unfollow"]),
  targetUserId: z.string(),
  context: z.enum(["same_school", "same_subject", "leaderboard", "search", "study_group", "other"]).optional(),
});

export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuth(request);
  const formData = await request.formData();

  console.log("connection data",formData)
  const validated = connectionActionSchema.safeParse(Object.fromEntries(formData));
  
  if (!validated.success) {
    return Response.json({ errors: "Invalid request", details: formatZodErrors(validated.error.flatten().fieldErrors) }, { status: 400 });
  }

  console.log(">>valided data",validated.data)
  
  const { action, targetUserId, context } = validated.data;
  const currentUserId = session.user.id;
  
  // Prevent self-connection
  if (currentUserId === targetUserId) {
    return Response.json({ error: "Cannot connect with yourself" }, { status: 400 });
  }
  
  // Check target exists and is public/allowing requests
  const targetProfile = await db.query.studentProfile.findFirst({
    where: eq(studentProfile.userId, targetUserId),
    columns: { isPublic: true, allowFriendRequests: true }
  });
  
  if (!targetProfile) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }
  
  // Handle each action type
  switch (action) {
    case "send": {
      if (!targetProfile.allowFriendRequests) {
        return Response.json({ error: "This user doesn't accept connection requests" }, { status: 403 });
      }
      
      // Check for existing connection
      const existing = await db.query.userConnection.findFirst({
        where: and(
          eq(userConnection.followerId, currentUserId),
          eq(userConnection.followingId, targetUserId)
        )
      });
      
      if (existing) {
        return Response.json({ error: "Connection already exists", status: existing.status }, { status: 409 });
      }
      
      // Create pending connection
      await db.insert(userConnection).values({
        followerId: currentUserId,
        followingId: targetUserId,
        status: "pending",
        connectionContext: context || "search",
      });
      
      // TODO: Trigger notification to target user (Phase 5)
      
      return { success: true, status: "pending", message: "Request sent" };
    }
    
    case "accept": {
      // Verify the request exists and is pending TO current user
      const connection = await db.query.userConnection.findFirst({
        where: and(
          eq(userConnection.followerId, targetUserId), // They sent to you
          eq(userConnection.followingId, currentUserId),
          eq(userConnection.status, "pending")
        )
      });
      
      if (!connection) {
        return Response.json({ error: "No pending request found" }, { status: 404 });
      }
      
      // Accept: update status
      await db.update(userConnection)
        .set({ status: "accepted", updatedAt: new Date() })
        .where(eq(userConnection.id, connection.id));
      
      // TODO: Trigger "You're now connected" notification
      
      return { success: true, status: "accepted", message: "Connected!" };
    }
    
    case "decline": {
      const connection = await db.query.userConnection.findFirst({
        where: and(
          eq(userConnection.followerId, targetUserId),
          eq(userConnection.followingId, currentUserId),
          eq(userConnection.status, "pending")
        )
      });
      
      if (!connection) {
        return Response.json({ error: "No pending request found" }, { status: 404 });
      }
      
      // Decline: update status (or delete)
      await db.update(userConnection)
        .set({ status: "rejected", updatedAt: new Date() })
        .where(eq(userConnection.id, connection.id));
      
      return { success: true, status: "rejected", message: "Request declined" };
    }
    
    case "block": {
      // Block: upsert with blocked status (works for any existing state)
      await db.insert(userConnection)
        .values({
          followerId: currentUserId,
          followingId: targetUserId,
          status: "blocked",
          connectionContext: "other",
        })
        .onConflictDoUpdate({
          target: [userConnection.followerId, userConnection.followingId],
          set: { status: "blocked", updatedAt: new Date() }
        });
      
      return { success: true, status: "blocked", message: "User blocked" };
    }
    
    case "unfollow": {
      // Delete the connection (soft delete by setting status if you prefer)
      await db.delete(userConnection)
        .where(and(
          eq(userConnection.followerId, currentUserId),
          eq(userConnection.followingId, targetUserId)
        ));
      
      return { success: true, status: "none", message: "Unfollowed" };
    }
    
    default:
      return Response.json({ error: "Unknown action" }, { status: 400 });
  }
}