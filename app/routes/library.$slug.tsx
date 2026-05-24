import { useState, useEffect } from "react";
import { useLoaderData, useFetcher, Link } from "react-router";
import {
  ArrowLeft, Download, Bookmark,
  Calendar, Star, Share2,
  CheckCircle2, Loader2, AlertCircle,
} from "lucide-react";
import { db } from "~/db";
import { resource, resourceCategory, resourceBookmark, resourceDownload } from "~/db/schema/library";
import { requireAuth } from "~/lib/auth";
import { eq, and, sql } from "drizzle-orm";
import type { Route } from "./+types/library.$slug";
import { lazy, Suspense } from "react";
import { data } from "react-router";
// ── SVG category illustrations ────────────────────────────────────────────────
import Paper from "~/assets/library/paper.svg";
import Textbooks from "~/assets/library/Placeholder book.svg";
import StudyGuide from "~/assets/library/guide.svg";
import Pamphlet from "~/assets/library/pamphlet.svg";
import MakingSchema from "~/assets/library/solutions.svg";
import Syllabus from "~/assets/library/syllabus.svg";
import Practice from "~/assets/library/Yellow Quiz.svg";

// ✅ Map slug → illustration
const CAT_ILLUSTRATION: Record<string, string> = {
  "past-papers": Paper,
  "marking-schemes": MakingSchema,
  "textbooks": Textbooks,
  "study-guides": StudyGuide,
  "practice-questions": Practice,
  "syllabus": Syllabus,
  "pamphlets": Pamphlet,
};

const PdfPreviewClient = lazy(() => import("~/components/library/PdfViewer"));

// ── Loader ────────────────────────────────────────────────────────────────────
export async function loader({ params, request }: Route.LoaderArgs) {
  const session = await requireAuth(request);

  const res = await db
    .select({
      id: resource.id,
      title: resource.title,
      slug: resource.slug,
      description: resource.description,
      level: resource.level,
      subject: resource.subject,
      year: resource.year,
      edition: resource.edition,
      publisher: resource.publisher,
      authors: resource.authors,
      fileType: resource.fileType,
      fileSize: resource.fileSize,
      fileUrl: resource.fileUrl,
      thumbnailUrl: resource.thumbnailUrl,
      previewPages: resource.previewPages,
      isPublished: resource.isPublished,
      isPremium: resource.isPremium,
      downloadCount: resource.downloadCount,
      createdAt: resource.createdAt,
      categoryName: resourceCategory.name,
      categorySlug: resourceCategory.slug,
      categoryIcon: resourceCategory.icon,
    })
    .from(resource)
    .innerJoin(resourceCategory, eq(resource.categoryId, resourceCategory.id))
    .where(and(eq(resource.slug, params.slug), eq(resource.isPublished, true)))
    .limit(1);

  if (!res[0]) throw new Response("Not found", { status: 404 });

  const r = res[0];

  const bookmarkRow = await db.query.resourceBookmark.findFirst({
    where: and(
      eq(resourceBookmark.resourceId, r.id),
      eq(resourceBookmark.userId, session.user.id),
    ),
    columns: { id: true },
  });

  const downloadRow = await db.query.resourceDownload.findFirst({
    where: and(
      eq(resourceDownload.resourceId, r.id),
      eq(resourceDownload.userId, session.user.id),
    ),
    columns: { id: true, downloadedAt: true },
  });

  const related = await db
    .select({
      id: resource.id,
      title: resource.title,
      slug: resource.slug,
      fileType: resource.fileType,
      downloadCount: resource.downloadCount,
      isPremium: resource.isPremium,
      year: resource.year,
      categoryIcon: resourceCategory.icon,
    })
    .from(resource)
    .innerJoin(resourceCategory, eq(resource.categoryId, resourceCategory.id))
    .where(
      and(
        eq(resource.isPublished, true),
        eq(resource.subject, r.subject),
        eq(resource.level, r.level),
        sql`${resource.id} != ${r.id}`,
      )
    )
    .limit(4);

  return data(
    // ✅ plain object — RR7 infers types from this correctly
    { resource: r, isBookmarked: !!bookmarkRow, hasDownloaded: !!downloadRow, related },
    {
      headers: {
        // Cache detail page for 5 minutes, stale-while-revalidate for 1 hour
        "cache-control": "public, max-age=300, stale-while-revalidate=3600",
      },
    }
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatBytes(bytes?: number | null) {
  if (!bytes) return null;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

const LEVEL_LABEL: Record<string, string> = {
  olevel: "O-Level", alevel: "A-Level", both: "Both Levels",
};

const LEVEL_STYLE: Record<string, string> = {
  olevel: "bg-sky-100 text-sky-800 border-sky-200",
  alevel: "bg-violet-100 text-violet-800 border-violet-200",
  both: "bg-stone-100 text-stone-700 border-stone-200",
};

const FILE_LABEL: Record<string, string> = {
  pdf: "PDF Document", zip: "ZIP Archive",
  doc: "Word Document", docx: "Word Document",
  ppt: "PowerPoint", pptx: "PowerPoint",
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ResourceDetailPage() {
  const { resource: r, isBookmarked, hasDownloaded, related } =
    useLoaderData<typeof loader>();

  const downloadFetcher = useFetcher<{ success: boolean; downloadUrl: string; fileName: string }>();
  const bookmarkFetcher = useFetcher<{ success: boolean; bookmarked: boolean }>();

  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [downloaded, setDownloaded] = useState(hasDownloaded);
  const [copyDone, setCopyDone] = useState(false);

  useEffect(() => {
    if (downloadFetcher.data?.success && downloadFetcher.data.downloadUrl) {
      const a = document.createElement("a");
      a.href = downloadFetcher.data.downloadUrl;
      a.download = downloadFetcher.data.fileName;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setDownloaded(true);
    }
  }, [downloadFetcher.data]);

  const handleDownload = () => {
    downloadFetcher.submit(
      { intent: "download", resourceId: r.id },
      { method: "POST", action: "/api/library/download" }
    );
  };

  const handleBookmark = () => {
    const next = !bookmarked;
    setBookmarked(next);
    bookmarkFetcher.submit(
      { intent: "bookmark", resourceId: r.id, action: next ? "add" : "remove" },
      { method: "POST", action: "/api/library/download" }
    );
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: r.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    }
  };

  const isDownloading = downloadFetcher.state !== "idle";
  const size = formatBytes(r.fileSize);

  return (
    <div
      className="min-h-screen pb-28"
      style={{ background: "linear-gradient(160deg, #fafaf8 0%, #f5f3ee 100%)" }}
    >
      {/* ── Sticky top bar ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-stone-200/80">
        <div className="max-w-3xl mx-auto px-4 h-13 flex items-center justify-between py-3">
          <Link
            to="/library"
            className="flex items-center gap-1.5 text-stone-500 hover:text-stone-800 text-sm transition-colors"
          >
            <ArrowLeft size={15} /> Library
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-all"
              aria-label="Share"
            >
              {copyDone
                ? <CheckCircle2 size={17} className="text-emerald-500" />
                : <Share2 size={17} />}
            </button>
            <button
              onClick={handleBookmark}
              className={`p-2 rounded-xl transition-all ${bookmarked
                ? "text-amber-500 bg-amber-50"
                : "text-stone-400 hover:text-amber-500 hover:bg-amber-50"
                }`}
              aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
            >
              <Bookmark size={17} className={bookmarked ? "fill-current" : ""} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* ── Hero block ─────────────────────────────────────────────────────── */}
        <div className="flex gap-6 items-start">
          <div className="shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 flex items-center justify-center shadow-sm">
            {r.thumbnailUrl ? (
              <img src={r.thumbnailUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl">{r.categoryIcon ?? "📄"}</span>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <p className="text-xs text-stone-400 font-medium">
              {CAT_ILLUSTRATION[r.categorySlug] && (
                <img
                  src={CAT_ILLUSTRATION[r.categorySlug]}
                  alt=""
                  className="w-8 h-8 object-contain"
                />
              )}

              {r.categoryName}
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 leading-snug">
              {r.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide border ${LEVEL_STYLE[r.level] ?? LEVEL_STYLE.both}`}>
                {LEVEL_LABEL[r.level] ?? r.level}
              </span>
              <span className="px-2.5 py-1 bg-stone-100 text-stone-600 rounded-lg text-[11px] font-semibold border border-stone-200">
                {r.subject}
              </span>
              {r.year && (
                <span className="flex items-center gap-1 text-[11px] text-stone-500">
                  <Calendar size={11} /> {r.year}
                </span>
              )}
              {r.isPremium && (
                <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-[11px] font-bold border border-amber-200">
                  <Star size={10} className="fill-current" /> Premium
                </span>
              )}
              {downloaded && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                  <CheckCircle2 size={11} /> Downloaded
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Download CTA card ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                {FILE_LABEL[r.fileType] ?? r.fileType.toUpperCase()}
              </p>
              <div className="flex items-center gap-3 text-sm text-stone-600">
                {size && <span>{size}</span>}
                <span className="flex items-center gap-1.5">
                  <Download size={13} className="text-stone-400" />
                  {r.downloadCount.toLocaleString()} downloads
                </span>
              </div>
            </div>

            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm ${r.isPremium
                ? "bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-60"
                : "bg-primary hover:bg-stone-800 text-white disabled:opacity-60"
                }`}
            >
              {isDownloading
                ? <><Loader2 size={15} className="animate-spin" /> Preparing…</>
                : r.isPremium
                  ? <><Star size={15} className="fill-current" /> Unlock & Download</>
                  : <><Download size={15} /> Download Free</>}
            </button>
          </div>

          {downloadFetcher.data && !downloadFetcher.data.success && (
            <div className="mt-3 flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={13} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-700">Download failed — please try again</p>
            </div>
          )}
        </div>

        {/* ── Description ────────────────────────────────────────────────────── */}
        {r.description && (
          <section className="space-y-2">
            <h2 className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">
              About this resource
            </h2>
            <p className="text-stone-700 leading-relaxed text-sm sm:text-base">
              {r.description}
            </p>
          </section>
        )}

        {/* ── Details grid ───────────────────────────────────────────────────── */}
        <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: "Subject", value: r.subject },
            { label: "Level", value: LEVEL_LABEL[r.level] },
            { label: "Year", value: r.year?.toString() },
            { label: "Format", value: r.fileType.toUpperCase() },
            { label: "Size", value: size },
            { label: "Edition", value: r.edition },
            { label: "Publisher", value: r.publisher },
            { label: "Authors", value: r.authors },
          ]
            .filter(d => d.value)
            .map(d => (
              <div key={d.label} className="bg-white rounded-xl border border-tertiary px-4 py-3">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">
                  {d.label}
                </p>
                <p className="text-sm font-semibold text-stone-800 truncate">{d.value}</p>
              </div>
            ))}
        </section>

        {/* ── PDF Preview ────────────────────────────────────────────────────── */}
        {r.fileType === "pdf" && r.fileUrl && (
          <section className="space-y-3">
            <h2 className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">
              Preview
            </h2>
            <Suspense fallback={
              <div className="bg-white rounded-2xl border border-stone-200 flex items-center justify-center gap-2 py-16">
                <Loader2 size={20} className="animate-spin text-stone-400" />
                <span className="text-sm text-stone-400">Loading preview…</span>
              </div>
            }>
              <PdfPreviewClient
                fileUrl={r.fileUrl}
                maxPages={r.isPremium ? 2 : (r.previewPages ?? 5)}
                isPremium={r.isPremium as boolean}
                onDownload={handleDownload}
              />
            </Suspense>
          </section>
        )}

        {/* ── Related resources ──────────────────────────────────────────────── */}
        {related.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">
              More {r.subject} resources
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {related.map(rel => (
                <Link
                  key={rel.id}
                  to={`/library/${rel.slug}`}
                  className="group flex items-center gap-3 bg-white rounded-xl border border-stone-200 p-3.5 hover:border-amber-300 hover:shadow-sm transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-800 line-clamp-2 group-hover:text-amber-700 transition-colors leading-snug">
                      {rel.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-400">
                      {rel.year && <span>{rel.year}</span>}
                      <span className="uppercase font-mono">{rel.fileType}</span>
                      {rel.isPremium && <Star size={9} className="text-amber-500 fill-current" />}
                      <span className="ml-auto flex items-center gap-0.5">
                        <Download size={9} /> {rel.downloadCount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <ArrowLeft size={14} className="text-stone-300 rotate-180 shrink-0 group-hover:text-amber-400 transition-colors" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}