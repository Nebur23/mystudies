import { Link, useFetcher } from "react-router";
import { useEffect, useRef, useState } from "react";
import {
  Download, Bookmark, FileText, BookOpen,
  Calendar, Star, Loader2,
} from "lucide-react";

interface Resource {
  id:            string;
  title:         string;
  slug:          string;
  description?:  string | null;
  level:         string;
  subject:       string;
  year?:         number | null;
  fileType:      string;
  fileSize?:     number | null;
  downloadCount: number;
  isPremium:     boolean | null;
  thumbnailUrl?: string | null;
  category:      { name: string; slug: string; icon?: string | null };
}

interface Props {
  resource:         Resource;
  isBookmarked:     boolean;
  onBookmarkToggle: (id: string, nowBookmarked: boolean) => void;
}

function formatSize(bytes?: number | null) {
  if (!bytes) return null;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

const FILE_COLORS: Record<string, { bg: string; text: string }> = {
  pdf:  { bg: "bg-red-50",    text: "text-red-700"    },
  zip:  { bg: "bg-amber-50",  text: "text-amber-700"  },
  doc:  { bg: "bg-blue-50",   text: "text-blue-700"   },
  docx: { bg: "bg-blue-50",   text: "text-blue-700"   },
  ppt:  { bg: "bg-orange-50", text: "text-orange-700" },
  pptx: { bg: "bg-orange-50", text: "text-orange-700" },
};

const LEVEL_STYLE: Record<string, string> = {
  olevel: "bg-sky-100 text-sky-700",
  alevel: "bg-violet-100 text-violet-700",
  both:   "bg-stone-100 text-stone-600",
};

export function ResourceCard({ resource, isBookmarked, onBookmarkToggle }: Props) {
  const bookmarkFetcher = useFetcher<{ success?: boolean; bookmarked?: boolean; error?: string }>();

  const fileStyle = FILE_COLORS[resource.fileType] ?? { bg: "bg-stone-100", text: "text-stone-600" };
  const size = formatSize(resource.fileSize);
  const isBookmarking = bookmarkFetcher.state !== "idle";

  // Optimistic bookmark state
  const [optimisticBookmarked, setOptimisticBookmarked] = useState(isBookmarked);
  const previousBookmarkState = useRef(isBookmarked);
  const [bookmarkError, setBookmarkError] = useState("");
  useEffect(() => { setOptimisticBookmarked(isBookmarked); }, [isBookmarked]);

  useEffect(() => {
    if (bookmarkFetcher.state !== "idle" || !bookmarkFetcher.data) return;
    if (bookmarkFetcher.data.error || bookmarkFetcher.data.success === false) {
      setOptimisticBookmarked(previousBookmarkState.current);
      onBookmarkToggle(resource.id, previousBookmarkState.current);
      setBookmarkError(bookmarkFetcher.data.error ?? "Could not update bookmark. Please try again.");
    }
  }, [bookmarkFetcher.state, bookmarkFetcher.data, onBookmarkToggle, resource.id]);

  const handleBookmark = () => {
    previousBookmarkState.current = optimisticBookmarked;
    const next = !optimisticBookmarked;
    setBookmarkError("");
    setOptimisticBookmarked(next);
    onBookmarkToggle(resource.id, next);
    bookmarkFetcher.submit(
      { intent: "bookmark", resourceId: resource.id, action: next ? "add" : "remove" },
      { method: "POST", action: "/api/library/download" }
    );
  };

  return (
    <div
      className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex gap-4 p-4 sm:gap-5 sm:p-5">

        {/* Icon / thumbnail */}
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted sm:h-20 sm:w-20">
          {resource.thumbnailUrl ? (
            <img
              src={resource.thumbnailUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <span className="text-2xl">{resource.category.icon ?? "📄"}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* Title + bookmark */}
          <div className="flex items-start gap-2">
            <h3
              className="line-clamp-2 flex-1 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-base"
            >
              {resource.title}
            </h3>
            <button
              type="button"
              onClick={handleBookmark}
              disabled={isBookmarking}
              className={`shrink-0 rounded-lg p-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                optimisticBookmarked
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
              }`}
              aria-label={optimisticBookmarked ? "Remove bookmark" : "Bookmark"}
            >
              {isBookmarking
                ? <Loader2 size={14} className="animate-spin" />
                : <Bookmark size={14} className={optimisticBookmarked ? "fill-current" : ""} />}
            </button>
          </div>
          {bookmarkError && (
            <p role="alert" className="mt-2 text-xs text-destructive">{bookmarkError}</p>
          )}

          {/* Badges */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${LEVEL_STYLE[resource.level] ?? LEVEL_STYLE.both}`}>
              {resource.level === "olevel" ? "O-Level" : resource.level === "alevel" ? "A-Level" : "Both"}
            </span>
            <span className="rounded-md bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
              {resource.subject}
            </span>
            {resource.year && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Calendar size={11} /> {resource.year}
              </span>
            )}
            <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${fileStyle.bg} ${fileStyle.text}`}>
              {resource.fileType}
            </span>
            {resource.isPremium && (
              <span className="flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">
                <Star size={9} className="fill-current" /> Premium
              </span>
            )}
          </div>

          {/* Description */}
          {resource.description && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {resource.description}
            </p>
          )}

          {/* Meta + actions */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Download size={10} /> {resource.downloadCount.toLocaleString()}
              </span>
              {size && <span>{size}</span>}
            </div>

            <div className="flex items-center gap-1.5">
              <Link
                to={`/library/${resource.slug}`}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[11px] font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <FileText size={10} /> Info
              </Link>

              {resource.fileType === "pdf" ? (
                <Link
                  to={`/library/${resource.slug}/view`}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[11px] font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <BookOpen size={10} /> View
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}