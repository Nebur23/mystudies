import { Link, useFetcher } from "react-router";
import { useEffect, useState } from "react";
import {
  Download, Bookmark, FileText, BookOpen,
  Calendar, Star, ExternalLink, Loader2,
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
  pdf:  { bg: "bg-red-50",    text: "text-red-600"    },
  zip:  { bg: "bg-amber-50",  text: "text-amber-600"  },
  doc:  { bg: "bg-blue-50",   text: "text-blue-600"   },
  docx: { bg: "bg-blue-50",   text: "text-blue-600"   },
  ppt:  { bg: "bg-orange-50", text: "text-orange-600" },
  pptx: { bg: "bg-orange-50", text: "text-orange-600" },
};

const LEVEL_STYLE: Record<string, string> = {
  olevel: "bg-sky-100 text-sky-700",
  alevel: "bg-violet-100 text-violet-700",
  both:   "bg-stone-100 text-stone-600",
};

export function ResourceCard({ resource, isBookmarked, onBookmarkToggle }: Props) {
  const bookmarkFetcher = useFetcher<{ success: boolean; bookmarked: boolean }>();

  const fileStyle = FILE_COLORS[resource.fileType] ?? { bg: "bg-stone-100", text: "text-stone-600" };
  const size = formatSize(resource.fileSize);
  const isBookmarking = bookmarkFetcher.state !== "idle";

  // Optimistic bookmark state
  const [optimisticBookmarked, setOptimisticBookmarked] = useState(isBookmarked);
  useEffect(() => { setOptimisticBookmarked(isBookmarked); }, [isBookmarked]);

  const handleBookmark = () => {
    const next = !optimisticBookmarked;
    setOptimisticBookmarked(next);
    onBookmarkToggle(resource.id, next);
    bookmarkFetcher.submit(
      { intent: "bookmark", resourceId: resource.id, action: next ? "add" : "remove" },
      { method: "POST", action: "/api/library/download" }
    );
  };

  return (
    <div
      className="group bg-white rounded-2xl border border-stone-200 hover:border-stone-300 hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      <div className="flex gap-4 p-4">

        {/* Icon / thumbnail */}
        <div className="shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-stone-50 border border-stone-100 flex items-center justify-center">
          {resource.thumbnailUrl ? (
            <img
              src={resource.thumbnailUrl}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
              className="flex-1 font-semibold text-stone-900 leading-snug line-clamp-2 text-sm group-hover:text-amber-700 transition-colors"
            >
              {resource.title}
            </h3>
            <button
              onClick={handleBookmark}
              disabled={isBookmarking}
              className={`shrink-0 p-1.5 rounded-lg transition-all ${
                optimisticBookmarked
                  ? "text-amber-500 bg-amber-50"
                  : "text-stone-300 hover:text-amber-500 hover:bg-amber-50"
              }`}
              aria-label={optimisticBookmarked ? "Remove bookmark" : "Bookmark"}
            >
              <Bookmark size={14} className={optimisticBookmarked ? "fill-current" : ""} />
            </button>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${LEVEL_STYLE[resource.level] ?? LEVEL_STYLE.both}`}>
              {resource.level === "olevel" ? "O-Level" : resource.level === "alevel" ? "A-Level" : "Both"}
            </span>
            <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded-md text-[10px] font-medium">
              {resource.subject}
            </span>
            {resource.year && (
              <span className="flex items-center gap-0.5 text-[10px] text-stone-400">
                <Calendar size={9} /> {resource.year}
              </span>
            )}
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${fileStyle.bg} ${fileStyle.text}`}>
              {resource.fileType}
            </span>
            {resource.isPremium && (
              <span className="flex items-center gap-0.5 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[10px] font-bold border border-amber-200">
                <Star size={9} className="fill-current" /> Premium
              </span>
            )}
          </div>

          {/* Description */}
          {resource.description && (
            <p className="text-xs text-stone-500 mt-2 line-clamp-2 leading-relaxed">
              {resource.description}
            </p>
          )}

          {/* Meta + actions */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
            <div className="flex items-center gap-3 text-[11px] text-stone-400">
              <span className="flex items-center gap-1">
                <Download size={10} /> {resource.downloadCount.toLocaleString()}
              </span>
              {size && <span>{size}</span>}
            </div>

            <div className="flex items-center gap-1.5">
              <Link
                to={`/library/${resource.slug}`}
                className="flex items-center gap-1 px-2.5 py-1.5 border border-stone-200 rounded-lg text-[11px] font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
              >
                <FileText size={10} /> Info
              </Link>

              {resource.fileType === "pdf" ? (
                <Link
                  to={`/library/${resource.slug}/view`}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-white text-[11px] font-bold hover:bg-stone-900 transition-colors"
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