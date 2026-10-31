import { requireAuth } from "~/lib/auth.server";
import { subscribe, unsubscribe } from "~/utils/feed/sse";
import type { Route } from "./+types/api.notifications.stream";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request);
  const userId  = session.user.id;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      function send(data: object) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch { /* client disconnected */ }
      }

      send({ type: "connected", userId });

      // Keep-alive ping every 25s
      const ping = setInterval(() => {
        try { controller.enqueue(encoder.encode(": ping\n\n")); }
        catch { clearInterval(ping); }
      }, 25_000);

      // Reuse the same shared pg LISTEN connection from sse.ts
      const handler = (payload: string) => {
        try {
          const parsed = JSON.parse(payload);
          // Only forward if this notification belongs to this user
          if (parsed.userId === userId) {
            send({ type: "new_notification", ...parsed });
          }
        } catch { /* malformed payload */ }
      };

      // ✅ Use "new_user_notification" channel — matches the NOTIFY in api.report.ts
      subscribe(userId, handler, "new_user_notification");

      request.signal.addEventListener("abort", () => {
        clearInterval(ping);
        unsubscribe(userId, handler, "new_user_notification");
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":      "text/event-stream",
      "Cache-Control":     "no-cache",
      "Connection":        "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
