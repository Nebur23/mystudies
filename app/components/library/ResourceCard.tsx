import { Link } from "react-router";
import {
  Download, Bookmark, FileText, BookOpen,
  Calendar, Star, Package, ExternalLink,
} from "lucide-react";

interface Resource {
  id:            string;
  title:         string;
  slug:          string;
  description?:  string;
  level:         string;
  subject:       string;
  year?:         number;
  fileType:      string;
  fileSize?:     number;
  downloadCount: number;
  isPremium:     boolean;
  thumbnailUrl?: string;
  category:      { name: string; slug: string; icon?: string };
}

interface Props {
  resource:         Resource;
  isBookmarked:     boolean;
  onBookmarkToggle: () => void;
}

function formatSize(bytes?: number) {
  if (!bytes) return null;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

const FILE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  pdf:  { bg: "bg-red-50",    text: "text-red-600",    label: "PDF"  },
  zip:  { bg: "bg-amber-50",  text: "text-amber-600",  label: "ZIP"  },
  doc:  { bg: "bg-blue-50",   text: "text-blue-600",   label: "DOC"  },
  docx: { bg: "bg-blue-50",   text: "text-blue-600",   label: "DOCX" },
  ppt:  { bg: "bg-orange-50", text: "text-orange-600", label: "PPT"  },
};

const LEVEL_STYLE: Record<string, string> = {
  olevel: "bg-sky-100 text-sky-700",
  alevel: "bg-violet-100 text-violet-700",
  both:   "bg-stone-100 text-stone-600",
};

export function ResourceCard({ resource, isBookmarked, onBookmarkToggle }: Props) {
  const fileStyle = FILE_COLORS[resource.fileType] ?? { bg: "bg-stone-100", text: "text-stone-600", label: resource.fileType.toUpperCase() };
  const size      = formatSize(resource.fileSize);

  return (
    <div
      className="group bg-white rounded-2xl border border-stone-200 hover:border-stone-300 hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      <div className="flex gap-4 p-4">

        {/* ── Icon / thumbnail ── */}
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

        {/* ── Content ── */}
        <div className="flex-1 min-w-0">

          {/* Top row */}
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <h3
                className="font-semibold text-stone-900 leading-snug line-clamp-2 text-sm group-hover:text-amber-700 transition-colors"
              >
                {resource.title}
              </h3>
            </div>

            {/* Bookmark */}
            <button
              onClick={onBookmarkToggle}
              className={`shrink-0 p-1.5 rounded-lg transition-all ${
                isBookmarked
                  ? "text-amber-500 bg-amber-50"
                  : "text-stone-300 hover:text-amber-500 hover:bg-amber-50"
              }`}
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark"}
            >
              <Bookmark size={14} className={isBookmarked ? "fill-current" : ""} />
            </button>
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {/* Level */}
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${LEVEL_STYLE[resource.level] ?? LEVEL_STYLE.both}`}>
              {resource.level === "olevel" ? "O-Level" : resource.level === "alevel" ? "A-Level" : "Both"}
            </span>

            {/* Subject */}
            <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded-md text-[10px] font-medium">
              {resource.subject}
            </span>

            {/* Year */}
            {resource.year && (
              <span className="flex items-center gap-0.5 text-[10px] text-stone-400">
                <Calendar size={9} /> {resource.year}
              </span>
            )}

            {/* File type */}
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${fileStyle.bg} ${fileStyle.text}`}>
              {fileStyle.label}
            </span>

            {/* Premium */}
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
              <span className="capitalize">{resource.category.name}</span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1.5">
              <Link
                to={`/library/${resource.slug}`}
                className="flex items-center gap-1 px-2.5 py-1.5 border border-stone-200 rounded-lg text-[11px] font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
              >
                <ExternalLink size={10} /> Details
              </Link>
              <Link
                to={`/library/${resource.slug}/download`}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                  resource.isPremium
                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                    : "bg-stone-800 hover:bg-stone-900 text-white"
                }`}
              >
                <Download size={10} />
                {resource.isPremium ? "Unlock" : "Download"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}