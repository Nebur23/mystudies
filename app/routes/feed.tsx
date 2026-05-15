import { useState, useEffect, useRef, useCallback } from "react";
import { useLoaderData } from "react-router";
import { ActivityCard, type Activity } from "~/components/feed/ActivityCard";
import { FeedComposer } from "~/components/feed/FeedComposer";
import { requireAuth } from "~/lib/auth.server";
import type { Route } from "./+types/feed";
import { BookOpen } from "lucide-react";
import { getFeeds } from "~/utils/feed/get";
import { studentProfile } from "~/db/schema/social";
import { db } from "~/db";
import { eq } from "drizzle-orm";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request);

  const [profile] = await db
    .select({
      id:          studentProfile.id,
      userId:      studentProfile.userId,
      displayName: studentProfile.displayName,
      username:    studentProfile.username,
      avatarUrl:   studentProfile.avatarUrl,
      school:      studentProfile.school,
      region:      studentProfile.region,
      level:       studentProfile.level,
      subjects:    studentProfile.subjects,
    })
    .from(studentProfile)
    .where(eq(studentProfile.userId, session.user.id))
    .limit(1);

  const feed = await getFeeds({ request });

  return {
    activities:  (feed.activities ?? []) as Activity[],
    nextCursor:  feed.nextCursor,
    hasNextPage: feed.hasNextPage,
    currentUser: profile,
    // Pass userId to client — avoids exposing full session
    currentUserId: session.user.id,
  };
}

export default function FeedPage() {
  const {
    activities: initialActivities,
    nextCursor:  initialCursor,
    hasNextPage: initialHasMore,
    currentUser,
    currentUserId,
  } = useLoaderData<typeof loader>();

  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [cursor,     setCursor]     = useState<string | null>(initialCursor);
  const [hasMore,    setHasMore]    = useState(initialHasMore);
  const [isLoading,  setIsLoading]  = useState(false);
  const [sseStatus,  setSseStatus]  = useState<"connecting" | "connected" | "error">("connecting");

  const loadMoreRef = useRef<HTMLDivElement>(null);

  // ── SSE: real-time new activities ────────────────────────────────────────────
  useEffect(() => {
    let es: EventSource;
    let retryTimeout: ReturnType<typeof setTimeout>;

    function connect() {
      // ✅ Correct SSE route path
      es = new EventSource("/api/feed/stream");

      es.onopen = () => setSseStatus("connected");

      es.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "new_activity" && data.activity) {
          setActivities(prev => {
            // Deduplicate — SSE may deliver before optimistic update clears
            if (prev.find(a => a.id === data.activity.id)) return prev;
            return [data.activity, ...prev];
          });
        }
      };

      es.onerror = () => {
        setSseStatus("error");
        es.close();
        // Exponential back-off capped at 30s
        retryTimeout = setTimeout(connect, Math.min(30_000, 5_000));
      };
    }

    connect();
    return () => {
      es?.close();
      clearTimeout(retryTimeout);
    };
  }, []);

  // ── Infinite scroll ───────────────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (!cursor || isLoading) return;
    setIsLoading(true);

    try {
      const res  = await fetch(`/api/feed/index?cursor=${encodeURIComponent(cursor)}`);
      const data = await res.json();

      setActivities(prev => {
        const existingIds = new Set(prev.map(a => a.id));
        const newItems    = (data.activities as Activity[]).filter(a => !existingIds.has(a.id));
        return [...prev, ...newItems];
      });
      setCursor(data.nextCursor);
      setHasMore(data.hasNextPage);
    } finally {
      setIsLoading(false);
    }
  }, [cursor, isLoading]);

  useEffect(() => {
    if (!hasMore || !loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: "150px" }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  // ── Optimistic handlers ───────────────────────────────────────────────────────
  const handleLike = (activityId: string, liked: boolean) => {
    setActivities(prev => prev.map(a =>
      a.id !== activityId ? a : {
        ...a,
        isLiked:    liked,
        likesCount: liked ? a.likesCount + 1 : Math.max(0, a.likesCount - 1),
      }
    ));
  };

  const handleComment = (activityId: string) => {
    setActivities(prev => prev.map(a =>
      a.id !== activityId ? a : { ...a, commentsCount: a.commentsCount + 1 }
    ));
  };

  const handleActivityCreated = (newActivity: Activity) => {
    setActivities(prev => {
      if (prev.find(a => a.id === newActivity.id)) return prev;
      return [newActivity, ...prev];
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-bold text-lg text-slate-900">Study Feed</h1>
          <span className={`flex items-center gap-1.5 text-xs transition-colors ${
            sseStatus === "connected" ? "text-green-600"
            : sseStatus === "error"   ? "text-red-400"
            : "text-slate-400"
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              sseStatus === "connected" ? "bg-green-500 animate-pulse"
              : sseStatus === "error"   ? "bg-red-400"
              : "bg-slate-300 animate-pulse"
            }`} />
            {sseStatus === "connected" ? "Live"
             : sseStatus === "error"   ? "Reconnecting..."
             : "Connecting..."}
          </span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Composer */}
        {currentUser && (
          <FeedComposer
            currentUser={currentUser}
            onActivityCreated={handleActivityCreated}
          />
        )}

        {/* Feed */}
        <div className="space-y-4">
          {activities.map(activity => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              currentUserId={currentUserId}   // ✅ real user id, not placeholder
              onLike={handleLike}
              onComment={handleComment}
            />
          ))}
        </div>

        {/* Load more sentinel */}
        {hasMore && (
          <div ref={loadMoreRef} className="py-4 text-center">
            {isLoading && (
              <div className="inline-flex items-center gap-2 text-sm text-slate-500">
                <span className="w-4 h-4 border-2 border-slate-300 border-t-purple-600 rounded-full animate-spin" />
                Loading more...
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {activities.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen size={24} className="text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">No activities yet</h3>
            <p className="text-sm text-slate-500 mb-4">Be the first to share your study progress!</p>
          </div>
        )}
      </main>
    </div>
  );
}
