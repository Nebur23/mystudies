import { eq, and, desc, sql, isNull } from "drizzle-orm";
import { db } from "~/db";
import { userNotification } from "~/db/schema/social";
import { requireAuth } from "~/lib/auth.server";
import type { Route } from "./+types/api.notifications.index";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request);
  const url     = new URL(request.url);
  const filter  = (url.searchParams.get("filter") ?? "all") as "all" | "unread" | "read";
  const cursor  = url.searchParams.get("cursor");
  const limit   = 15;

  const conditions = [eq(userNotification.userId, session.user.id)];
  if (filter === "unread") conditions.push(eq(userNotification.read, false));
  if (filter === "read")   conditions.push(eq(userNotification.read, true));
  if (cursor)              conditions.push(sql`${userNotification.createdAt} < ${new Date(cursor)}`);

  const [notifications, [{ unreadCount }]] = await Promise.all([
    db
      .select({
        id:          userNotification.id,
        type:        userNotification.type,
        title:       userNotification.title,
        body:        userNotification.body,
        data:        userNotification.data,
        read:        userNotification.read,
        createdAt:   userNotification.createdAt,
        deliveredAt: userNotification.deliveredAt,
        // Resolve sender username from jsonb field via correlated subquery
        fromUsername: sql<string | null>`(
          SELECT username FROM student_profile
          WHERE user_id = (${userNotification.data} ->> 'fromUserId')
          LIMIT 1
        )`,
      })
      .from(userNotification)
      .where(and(...conditions))
      .orderBy(desc(userNotification.createdAt))
      .limit(limit + 1),

    db
      .select({ unreadCount: sql<number>`COUNT(*)::int` })
      .from(userNotification)
      .where(and(
        eq(userNotification.userId, session.user.id),
        eq(userNotification.read, false),
      )),
  ]);

  const hasNextPage = notifications.length > limit;
  const items       = hasNextPage ? notifications.slice(0, -1) : notifications;
  const nextCursor  = hasNextPage
    ? items[items.length - 1].createdAt.toISOString()
    : null;

  return Response.json({ notifications: items, nextCursor, hasNextPage, unreadCount, filter });
}

export async function action({ request }: Route.ActionArgs) {
  const session  = await requireAuth(request);
  const formData = await request.formData();
  const intent   = formData.get("intent") as string;
  const notifId  = formData.get("notificationId") as string | null;

  if (intent === "mark_read" && notifId) {
    await db
      .update(userNotification)
      .set({ read: true, readAt: new Date() })
      .where(and(
        eq(userNotification.id, notifId),
        eq(userNotification.userId, session.user.id),
      ));
    return Response.json({ success: true, intent: "marked_read" });
  }

  if (intent === "mark_all_read") {
    await db
      .update(userNotification)
      .set({ read: true, readAt: new Date() })
      .where(and(
        eq(userNotification.userId, session.user.id),
        eq(userNotification.read, false),
      ));
    return Response.json({ success: true, intent: "all_marked_read" });
  }

  return Response.json({ error: "Unknown intent" }, { status: 400 });
}
