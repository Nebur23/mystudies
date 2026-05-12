import { getSessionSafe } from "~/lib/auth";
import { checkActivityVisibility } from "~/utils/feed/get";
import { subscribe, unsubscribe } from "~/utils/feed/sse";
import { db } from "~/db";
import { studyActivity, studentProfile } from "~/db/schema/social";
import { eq } from "drizzle-orm";
import type { Route } from "./+types/api.feed.stream";

// ─────────────────────────────────────────────────────────────
// Fetch full activity + author profile for SSE push
// ─────────────────────────────────────────────────────────────
async function fetchActivityData(activityId: string) {
  const rows = await db
    .select({
      id:            studyActivity.id,
      userId:        studyActivity.userId,
      type:          studyActivity.type,
      content:       studyActivity.content,
      visibility:    studyActivity.visibility,
      likesCount:    studyActivity.likesCount,
      commentsCount: studyActivity.commentsCount,
      createdAt:     studyActivity.createdAt,
      displayName:   studentProfile.displayName,
      username:      studentProfile.username,
      avatarUrl:     studentProfile.avatarUrl,
      level:         studentProfile.level,
    })
    .from(studyActivity)
    .innerJoin(studentProfile, eq(studentProfile.userId, studyActivity.userId))
    .where(eq(studyActivity.id, activityId))
    .limit(1);

  return rows[0] ?? null;
}

// ─────────────────────────────────────────────────────────────
// SSE loader — React Router v7 named export
// ─────────────────────────────────────────────────────────────
export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSessionSafe(request);
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // ── Helper: write an SSE event ──────────────────────────────────────
      function send(data: object) {
        const line = `data: ${JSON.stringify(data)}\n\n`;
        try {
          controller.enqueue(encoder.encode(line));
        } catch {
          // Controller already closed — client disconnected
        }
      }

      // ── Send connection ack immediately ─────────────────────────────────
      send({ type: "connected", userId });

      // ── Keep-alive ping every 25s (prevents proxy timeouts) ────────────
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(pingInterval);
        }
      }, 25_000);

      // ── NOTIFY payload handler ──────────────────────────────────────────
      const handler = async (payload: string) => {
        let parsed: { activityId: string; activityUserId: string };
        try {
          parsed = JSON.parse(payload);
        } catch {
          return; // malformed notify payload — skip
        }

        const isVisible = await checkActivityVisibility(
          parsed.activityId,
          userId,
          parsed.activityUserId
        );

        if (!isVisible) return;

        const activity = await fetchActivityData(parsed.activityId);
        if (activity) {
          send({ type: "new_activity", activity });
        }
      };

      // ── Subscribe to the shared listener ───────────────────────────────
      subscribe(userId, handler);

      // ── Cleanup when client disconnects ─────────────────────────────────
      // AbortSignal fires when the request is cancelled
      request.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        unsubscribe(userId, handler);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":      "text/event-stream",
      "Cache-Control":     "no-cache",
      "Connection":        "keep-alive",
      "X-Accel-Buffering": "no", // disable nginx buffering
    },
  });
}