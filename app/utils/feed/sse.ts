import postgres from "postgres";

// Dedicated listener connection — NOT from the pool
// LISTEN requires a persistent single connection
let listenerSql: postgres.Sql | null = null;
const subscribers = new Map<string, Set<(payload: string) => void>>();

function getListenerConnection() {
  if (!listenerSql) {
    listenerSql = postgres(process.env.DATABASE_URL!, {
      max: 1,
      idle_timeout: undefined, // keep alive forever
      connection: { application_name: "feed_listener" },
    });
  }
  return listenerSql;
}

// Called once at app startup (or lazily on first subscriber)
let isListening = false;

async function ensureListening() {
  if (isListening) return;
  isListening = true;

  const sql = getListenerConnection();

  await sql.listen("new_study_activity", (payload) => {
    // Fan out to all active SSE subscribers
    for (const handlers of subscribers.values()) {
      for (const handler of handlers) {
        handler(payload);
      }
    }
  });
}

export function subscribe(userId: string, handler: (payload: string) => void) {
  if (!subscribers.has(userId)) {
    subscribers.set(userId, new Set());
  }
  subscribers.get(userId)!.add(handler);
  ensureListening(); // no-op if already listening
}

export function unsubscribe(userId: string, handler: (payload: string) => void) {
  subscribers.get(userId)?.delete(handler);
  if (subscribers.get(userId)?.size === 0) {
    subscribers.delete(userId);
  }
}