import postgres from "postgres";

let listenerSql: postgres.Sql | null = null;

// channel → Set of handlers
const subscribers = new Map<string, Map<string, Set<(payload: string) => void>>>();
const listeningChannels = new Set<string>();

function getListenerConnection() {
  if (!listenerSql) {
    listenerSql = postgres(process.env.DATABASE_URL!, {
      max: 1,
      idle_timeout: undefined,
      connection: { application_name: "sse_listener" },
    });
  }
  return listenerSql;
}

async function ensureListening(channel: string) {
  if (listeningChannels.has(channel)) return;
  listeningChannels.add(channel);

  await getListenerConnection().listen(channel, (payload) => {
    const channelSubs = subscribers.get(channel);
    if (!channelSubs) return;
    for (const handlers of channelSubs.values()) {
      for (const handler of handlers) handler(payload);
    }
  });
}

// channel defaults to "new_study_activity" for backward compat
export function subscribe(
  userId: string,
  handler: (payload: string) => void,
  channel = "new_study_activity",
) {
  if (!subscribers.has(channel)) subscribers.set(channel, new Map());
  const channelSubs = subscribers.get(channel)!;
  if (!channelSubs.has(userId)) channelSubs.set(userId, new Set());
  channelSubs.get(userId)!.add(handler);
  ensureListening(channel);
}

export function unsubscribe(
  userId: string,
  handler: (payload: string) => void,
  channel = "new_study_activity",
) {
  subscribers.get(channel)?.get(userId)?.delete(handler);
  if (subscribers.get(channel)?.get(userId)?.size === 0) {
    subscribers.get(channel)?.delete(userId);
  }
}