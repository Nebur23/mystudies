import { db } from "~/db";
import { userNotification } from "~/db/schema/social";
import { sql } from "drizzle-orm";

// Helper — call this anywhere after an action affects another user
export async function createNotification({
  userId,       // recipient
  type,
  title,
  body,
  data,
}: {
  userId: string;
  type: typeof userNotification.$inferInsert["type"];
  title: string;
  body: string;
  data?: Record<string, string>;
}) {
  await db.insert(userNotification).values({ userId, type, title, body, data, inApp: true });

  // Wake up any SSE stream listening for this user
  const payload = JSON.stringify({ userId }).replace(/'/g, "''");
  await db.execute(sql.raw(`NOTIFY new_user_notification, '${payload}'`));
}



