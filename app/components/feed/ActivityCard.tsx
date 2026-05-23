import { useEffect, useState } from "react";
import { Link, useFetcher } from "react-router";
import {
  Heart, MessageCircle, Share2, MoreHorizontal,
  BookOpen, Trophy, Flame, Star,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Pressable } from "../ui/Pressable";

type ActivityType =
  | "quiz_completed" | "badge_earned" | "streak_milestone"
  | "leaderboard_rank" | "subject_enrolled" | "study_session_started"
  | "note_shared" | "question_asked" | "profile_updated";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  parentId: string | null;
  displayName: string;
  username: string;
  avatarUrl?: string;
  replyCount: number;
}

export interface Activity {
  id: string;
  userId: string;
  type: ActivityType;
  content: Record<string, any>;
  visibility: "public" | "connections_only" | "private";
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  displayName: string;
  username: string;
  avatarUrl?: string;
  level: string;
  isLiked: boolean;
  isFromConnection?: boolean;
}

interface Props {
  activity: Activity;
  currentUserId?: string;
  onLike?: (activityId: string, liked: boolean) => void;
  onComment?: (activityId: string) => void;
}

export function ActivityCard({ activity, currentUserId, onLike, onComment }: Props) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);

  // Separate fetchers for each concern
  const likeFetcher = useFetcher();
  const commentFetcher = useFetcher<{ success: boolean; comment: Comment }>();
  const loadFetcher = useFetcher<{ comments: Comment[]; hasNextPage: boolean }>();

  const isOwner = currentUserId === activity.userId;

  const optimisticLiked = activity.isLiked;
  const optimisticCount = activity.likesCount;

  // Append new comment from fetcher data when it resolves
  if (commentFetcher.data?.success && commentFetcher.data.comment) {
    const incoming = commentFetcher.data.comment;
    if (!comments.find(c => c.id === incoming.id)) {
      setComments(prev => [incoming, ...prev]);
    }
  }

  const handleLike = () => {
    const newLiked = !activity.isLiked;
    onLike?.(activity.id, newLiked);

    likeFetcher.submit(
      { intent: "like", activityId: activity.id, action: newLiked ? "add" : "remove" },
      { method: "POST", action: "/api/feed/engagement" }
    );
  };

  const handleToggleComments = () => {
    setShowComments(prev => !prev);

    // Load comments on first open
    if (!commentsLoaded) {
      setCommentsLoaded(true);
      loadFetcher.load(`/api/feed/engagement?activityId=${activity.id}`);
    }
  };

  // Sync loaded comments into state


  useEffect(() => {
    if (loadFetcher.data?.comments) {
      setComments(loadFetcher.data.comments);
    }
  }, [loadFetcher.data]);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || commentFetcher.state === "submitting") return;

    commentFetcher.submit(
      { intent: "comment", activityId: activity.id, content: commentText },
      { method: "POST", action: "/api/feed/engagement" }
    );

    setCommentText("");
    onComment?.(activity.id);
  };

  const renderContent = () => {
    switch (activity.type) {
      case "quiz_completed":
        return (
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <BookOpen size={20} className="text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-slate-700">
                Completed <span className="font-semibold">{activity.content.subject}</span>
                {activity.content.paper && <> · {activity.content.paper}</>}
              </p>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
                <span className="font-medium text-green-600">
                  {activity.content.score}/{activity.content.totalQuestions} correct
                </span>
                {activity.content.timeSpent && (
                  <><span>·</span><span>{Math.round(activity.content.timeSpent / 60)} min</span></>
                )}
              </div>
            </div>
          </div>
        );

      case "badge_earned":
        return (
          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
            <Trophy size={20} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-slate-700">
                Earned the <span className="font-semibold">{activity.content.badgeName}</span> badge
              </p>
              {activity.content.badgeIcon && (
                <span className="text-2xl mt-1 block">{activity.content.badgeIcon}</span>
              )}
            </div>
          </div>
        );

      case "streak_milestone":
        return (
          <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
            <Flame size={20} className="text-orange-600 mt-0.5 shrink-0" />
            <p className="text-sm text-slate-700">
              🔥 <span className="font-semibold">{activity.content.streakDays}-day</span> study streak!
            </p>
          </div>
        );

      case "leaderboard_rank":
        return (
          <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
            <Star size={20} className="text-purple-600 mt-0.5 shrink-0" />
            <p className="text-sm text-slate-700">
              Ranked <span className="font-semibold">#{activity.content.rank}</span>
              {activity.content.category && <> in {activity.content.category}</>}
            </p>
          </div>
        );

      case "note_shared":
      case "question_asked":
        return (
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-700 whitespace-pre-wrap">
              {activity.type === "note_shared" ? "📝" : "❓"}{" "}
              {activity.content.note ?? activity.content.question}
            </p>
          </div>
        );

      default:
        return activity.content.message
          ? <p className="text-sm text-slate-700">{activity.content.message}</p>
          : null;
    }
  };

  return (
    <article className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-2">
        <Link to={`/profile/${activity.username}`} className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold overflow-hidden shrink-0">
            {activity.avatarUrl
              ? <img src={activity.avatarUrl} alt="" className="w-full h-full object-cover" />
              : activity.displayName.charAt(0).toUpperCase()
            }
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-slate-900 truncate">{activity.displayName}</p>
            <p className="text-xs text-slate-500 truncate">@{activity.username}</p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
              <span>{activity.level === "olevel" ? "O-Level" : "A-Level"}</span>
              <span>·</span>
              <time dateTime={activity.createdAt as any as string}>
                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
              </time>
              {activity.isFromConnection && (
                <><span>·</span><span className="text-purple-500">Following</span></>
              )}
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          {activity.visibility !== "public" && (
            <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
              {activity.visibility === "connections_only" ? "Connections" : "Private"}
            </span>
          )}
          {isOwner && (
            <button className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
              <MoreHorizontal size={16} className="text-slate-500" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">{renderContent()}</div>

      {/* Engagement Bar */}
      <div className="flex items-center gap-4 px-4 py-3 border-t border-slate-100">


        <Pressable 

          onClick={handleLike}
          disabled={!currentUserId || likeFetcher.state !== "idle"}
          className={`flex items-center gap-1.5 text-sm transition-colors disabled:cursor-not-allowed ${optimisticLiked ? "text-red-500" : "text-slate-600 hover:text-red-500"
            }`}
        >

          <Heart size={16} className={optimisticLiked ? "fill-current" : ""} />

          <span>{Math.max(0, optimisticCount)}</span>

        </Pressable>
        <Pressable
          onClick={handleToggleComments}
          className={`flex items-center gap-1.5 text-sm transition-colors ${showComments ? "text-purple-600" : "text-slate-600 hover:text-purple-600"
            }`}
        >
          <MessageCircle size={16} />
          <span>{activity.commentsCount}</span>
        </Pressable>

        <button className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800 transition-colors ml-auto">
          <Share2 size={16} />
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-slate-100 bg-slate-50">
          {/* Comment Input */}
          {currentUserId && (
            <form onSubmit={handleCommentSubmit} className="flex gap-2 p-3 border-b border-slate-100">
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || commentFetcher.state === "submitting"}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {commentFetcher.state === "submitting" ? "..." : "Post"}
              </button>
            </form>
          )}

          {/* Comments List */}
          <div className="divide-y divide-slate-100">
            {loadFetcher.state === "loading" && (
              <p className="text-xs text-slate-400 text-center py-4">Loading comments...</p>
            )}

            {comments.map(comment => (
              <div key={comment.id} className="flex gap-3 p-3">
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                  {comment.avatarUrl
                    ? <img src={comment.avatarUrl} alt="" className="w-full h-full object-cover" />
                    : comment.displayName?.charAt(0).toUpperCase()
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-slate-900">{comment.displayName}</span>
                    <span className="text-[10px] text-slate-400">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mt-0.5 wrap-break-word">{comment.content}</p>
                  {comment.replyCount > 0 && (
                    <button className="text-xs text-purple-600 mt-1 hover:underline">
                      {comment.replyCount} {comment.replyCount === 1 ? "reply" : "replies"}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {commentsLoaded && comments.length === 0 && loadFetcher.state === "idle" && (
              <p className="text-xs text-slate-400 text-center py-4">No comments yet. Be first!</p>
            )}
          </div>
        </div>
      )}
    </article>
  );
}