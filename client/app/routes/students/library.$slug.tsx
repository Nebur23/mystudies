import { useState, useEffect } from "react";
import { useLoaderData, useFetcher, Link } from "react-router";
import { usePostHog } from "@posthog/react";
import {
  ArrowLeft, Download, Bookmark, BookOpen,
  Calendar, Star, Share2,
  CheckCircle2, Loader2, AlertCircle,
} from "lucide-react";
import { db } from "~/db";
import { resource, resourceCategory, resourceBookmark, resourceDownload } from "~/db/schema/library";
import { requireAuth } from "~/lib/auth";
import { eq, and, sql } from "drizzle-orm";
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
import { OfflinePdfCache } from "~/components/pwa/OfflinePdfCache";
import type { Route } from "./+types/library.$slug";

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
  const PREVIEW_PAGE_LIMIT = 5;

  const posthog = usePostHog();
  const downloadFetcher = useFetcher<{ success: boolean; downloadUrl: string; fileName: string }>();
  const bookmarkFetcher = useFetcher<{ success: boolean; bookmarked: boolean; error?: string }>();

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
    posthog?.capture("resource_downloaded", {
      resource_id: r.id,
      resource_title: r.title,
      resource_slug: r.slug,
      subject: r.subject,
      level: r.level,
      category: r.categoryName,
      is_premium: r.isPremium,
      file_type: r.fileType,
    });
    downloadFetcher.submit(
      { intent: "download", resourceId: r.id },
      { method: "POST", action: "/api/library/download" }
    );
  };

  const handleBookmark = () => {
    const next = !bookmarked;
    setBookmarked(next);
    posthog?.capture("resource_bookmarked", {
      resource_id: r.id,
      resource_title: r.title,
      resource_slug: r.slug,
      subject: r.subject,
      action: next ? "add" : "remove",
    });
    bookmarkFetcher.submit(
      { intent: "bookmark", resourceId: r.id, action: next ? "add" : "remove" },
      { method: "POST", action: "/api/library/download" }
    );
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareMethod = typeof navigator.share === "function" ? "native" : "clipboard";
    posthog?.capture("resource_shared", {
      resource_id: r.id,
      resource_title: r.title,
      resource_slug: r.slug,
      subject: r.subject,
      share_method: shareMethod,
    });
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
    <div className="min-h-screen bg-background pb-12 text-foreground">
      {/* ── Sticky top bar ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link
            to="/library"
            className="flex min-h-10 items-center gap-2 rounded-lg pr-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ArrowLeft size={16} /> Back to library
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="rounded-xl p-2.5 text-muted-foreground transition-all hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Share"
            >
              {copyDone
                ? <CheckCircle2 size={17} className="text-emerald-500" />
                : <Share2 size={17} />}
            </button>
            <button
              type="button"
              onClick={handleBookmark}
              disabled={bookmarkFetcher.state !== "idle"}
              className={`rounded-xl p-2.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${bookmarked
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
            >
              <Bookmark size={17} className={bookmarked ? "fill-current" : ""} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* ── Hero block ─────────────────────────────────────────────────────── */}
        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:gap-7 sm:p-8">
          <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted shadow-sm sm:h-36 sm:w-36">
            {r.thumbnailUrl ? (
              <img src={r.thumbnailUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              CAT_ILLUSTRATION[r.categorySlug]
                ? <img src={CAT_ILLUSTRATION[r.categorySlug]} alt="" className="h-20 w-20 object-contain" />
                : <span className="text-4xl">{r.categoryIcon ?? "📄"}</span>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {CAT_ILLUSTRATION[r.categorySlug] && (
                <img
                  src={CAT_ILLUSTRATION[r.categorySlug]}
                  alt=""
                  className="h-6 w-6 object-contain"
                />
              )}

              {r.categoryName}
            </p>
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              {r.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide border ${LEVEL_STYLE[r.level] ?? LEVEL_STYLE.both}`}>
                {LEVEL_LABEL[r.level] ?? r.level}
              </span>
              <span className="rounded-lg border border-border bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                {r.subject}
              </span>
              {r.year && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Calendar size={11} /> {r.year}
                </span>
              )}
              {r.isPremium && (
                <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-[11px] font-bold border border-amber-200">
                  <Star size={10} className="fill-current" /> Premium
                </span>
              )}
              {downloaded && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 size={11} /> Downloaded
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="space-y-4 border-t border-border bg-muted/40 px-5 py-5 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {FILE_LABEL[r.fileType] ?? r.fileType.toUpperCase()}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {size && <span>{size}</span>}
              <span className="flex items-center gap-1.5">
                <Download size={13} />
                {r.downloadCount.toLocaleString()} downloads
              </span>
            </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {r.fileType === "pdf" && (
                <Link
                  to={`/library/${r.slug}/view`}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <BookOpen size={16} /> Read online
                </Link>
              )}
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${r.isPremium
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-primary hover:bg-primary/90"
                  }`}
              >
                {isDownloading
                  ? <><Loader2 size={15} className="animate-spin" /> Preparing…</>
                  : r.isPremium
                    ? <><Star size={15} className="fill-current" /> Unlock & Download</>
                    : <><Download size={15} /> Download Free</>}
              </button>
            </div>
          </div>
          {r.fileType === "pdf" && (
            <OfflinePdfCache fileUrl={r.fileUrl} fileName={r.title} fileSize={r.fileSize} />
          )}
        </div>
        {downloadFetcher.data && !downloadFetcher.data.success && (
          <div role="alert" className="flex items-center gap-2 border-t border-destructive/20 bg-destructive/5 px-5 py-3 sm:px-8">
            <AlertCircle size={13} className="shrink-0 text-destructive" />
            <p className="text-xs text-destructive">Download failed — please try again</p>
          </div>
        )}
        </section>

        {/* ── Description ────────────────────────────────────────────────────── */}
        {r.description && (
          <section className="space-y-3 rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-foreground">
              About this resource
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              {r.description}
            </p>
          </section>
        )}

        {/* ── Details grid ───────────────────────────────────────────────────── */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
              <div key={d.label} className="rounded-2xl border border-border bg-card px-4 py-4 shadow-sm">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {d.label}
                </p>
                <p className="truncate text-sm font-semibold text-foreground">{d.value}</p>
              </div>
            ))}
        </section>

        {/* ── PDF Preview ────────────────────────────────────────────────────── */}
        {r.fileType === "pdf" && r.fileUrl && (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              Preview
            </h2>
            <Suspense fallback={
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-16">
                <Loader2 size={20} className="animate-spin text-stone-400" />
                <span className="text-sm text-muted-foreground">Loading preview…</span>
              </div>
            }>
              <PdfPreviewClient
                fileUrl={r.fileUrl}
                maxPages={PREVIEW_PAGE_LIMIT}
                slug={r.slug}
                isPremium={r.isPremium as boolean}
                onDownload={handleDownload}
              />
            </Suspense>
          </section>
        )}

        {/* ── Related resources ──────────────────────────────────────────────── */}
        {related.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              More {r.subject} resources
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {related.map(rel => (
                <Link
                  key={rel.id}
                  to={`/library/${rel.slug}`}
                  className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div className="flex-1 min-w-0">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                      {rel.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
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