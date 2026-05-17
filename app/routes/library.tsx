import { useState, useEffect } from "react";
import { useLoaderData, useSearchParams } from "react-router";
import {
  Search, SlidersHorizontal, BookOpen, FileText,
  Download, Bookmark, X, TrendingUp, Sparkles,
} from "lucide-react";
import { ResourceCard } from "~/components/library/ResourceCard";
import { LibraryFilterSheet } from "~/components/library/LibraryFilterSheet";
import type { Route } from "./+types/library";
import { db } from "~/db";
import { resource, resourceCategory, resourceBookmark } from "~/db/schema/library";
import { requireAuth } from "~/lib/auth";
import { eq, and, or, desc, asc, inArray, sql } from "drizzle-orm";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request);
  const url     = new URL(request.url);

  const search   = url.searchParams.get("q")?.trim()      ?? "";
  const category = url.searchParams.get("category")       ?? "";
  const level    = url.searchParams.get("level")          ?? "";
  const subject  = url.searchParams.get("subject")        ?? "";
  const year     = url.searchParams.get("year")           ?? "";
  const filter   = url.searchParams.get("filter")         ?? "all";

  // ── 1. Categories with counts ────────────────────────────────────────────
  const categories = await db
    .select({
      id:          resourceCategory.id,
      name:        resourceCategory.name,
      slug:        resourceCategory.slug,
      icon:        resourceCategory.icon,
      order:       resourceCategory.order,
      count:       sql<number>`COUNT(${resource.id})::int`,
    })
    .from(resourceCategory)
    .leftJoin(resource, and(
      eq(resource.categoryId, resourceCategory.id),
      eq(resource.isPublished, true),
    ))
    .groupBy(resourceCategory.id)
    .orderBy(asc(resourceCategory.order));

  // ── 2. User's bookmarks ──────────────────────────────────────────────────
  const userBookmarks = await db
    .select({ resourceId: resourceBookmark.resourceId })
    .from(resourceBookmark)
    .where(eq(resourceBookmark.userId, session.user.id));

  const bookmarkedIds = new Set(userBookmarks.map(b => b.resourceId));

  // ── 3. Build WHERE conditions ────────────────────────────────────────────
  const conditions = [eq(resource.isPublished, true)];

  if (search) {
    conditions.push(
      or(
        // tsvector full-text (raw column — not in Drizzle schema)
        sql`search_vector @@ websearch_to_tsquery('english', unaccent(${search}))`,
        // trgm fallback for short/partial queries
        sql`(
          coalesce(${resource.title}, '') || ' ' ||
          coalesce(${resource.subject}, '') || ' ' ||
          coalesce(${resource.description}, '')
        ) % ${search}`,
      ) as any
    );
  }

  if (category) conditions.push(
    eq(resourceCategory.slug, category)   // join needed — see query below
  );
  if (level)   conditions.push(eq(resource.level,   level   as "olevel" | "alevel" | "both"));
  if (subject) conditions.push(eq(resource.subject, subject));
  if (year)    conditions.push(eq(resource.year,    parseInt(year)));

  if (filter === "bookmarked" && bookmarkedIds.size > 0) {
    conditions.push(inArray(resource.id, [...bookmarkedIds]));
  } else if (filter === "bookmarked") {
    // No bookmarks — return empty
    return emptyResponse(categories, session.user.id);
  }

  // ── 4. Rank expression for search ───────────────────────────────────────
  const rankExpr = search
    ? sql<number>`CASE
        WHEN search_vector @@ websearch_to_tsquery('english', unaccent(${search}))
          THEN ts_rank(search_vector, websearch_to_tsquery('english', unaccent(${search}))) * 2
        ELSE similarity(
          coalesce(${resource.title},'') || ' ' || coalesce(${resource.subject},''),
          ${search}
        )
      END`
    : sql<number>`${resource.downloadCount}`;

  // ── 5. Main query ────────────────────────────────────────────────────────
  const resources = await db
    .select({
      id:            resource.id,
      title:         resource.title,
      slug:          resource.slug,
      description:   resource.description,
      level:         resource.level,
      subject:       resource.subject,
      year:          resource.year,
      fileType:      resource.fileType,
      fileSize:      resource.fileSize,
      downloadCount: resource.downloadCount,
      isPremium:     resource.isPremium,
      thumbnailUrl:  resource.thumbnailUrl,
      category: {
        name: resourceCategory.name,
        slug: resourceCategory.slug,
        icon: resourceCategory.icon,
      },
      rank: rankExpr,
    })
    .from(resource)
    .innerJoin(resourceCategory, eq(resource.categoryId, resourceCategory.id))
    .where(and(...conditions))
    .orderBy(
      search
        ? sql`rank DESC`
        : sql`${resource.isPremium} ASC, ${resource.downloadCount} DESC`
    )
    .limit(100);

  // ── 6. Available filter options ──────────────────────────────────────────
  const allMeta = await db
    .select({ subject: resource.subject, year: resource.year })
    .from(resource)
    .where(eq(resource.isPublished, true));

  const availableFilters = {
    subjects: [...new Set(allMeta.map(r => r.subject))].sort(),
    years:    [...new Set(allMeta.map(r => r.year).filter(Boolean) as number[])].sort((a, b) => b - a),
  };

  const isFiltering = !!(search || category || level || subject || year || filter !== "all");

  return {
    resources,
    categories,
    availableFilters,
    currentFilters: { search, category, level, subject, year, filter },
    bookmarkedSet:  Object.fromEntries([...bookmarkedIds].map(id => [id, true])),
    totalCount:     resources.length,
    isFiltering,
  };
}

function emptyResponse(categories: any[], userId: string) {
  return {
    resources:        [],
    categories,
    availableFilters: { subjects: [], years: [] },
    currentFilters:   { search: "", category: "", level: "", subject: "", year: "", filter: "bookmarked" },
    bookmarkedSet:    {} as Record<string, boolean>,
    totalCount:       0,
    isFiltering:      true,
  };
}

// ... component unchanged from previous version

// Category visual config
const CAT_CONFIG: Record<string, { bg: string; text: string; border: string; accent: string }> = {
    "past-papers": { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", accent: "bg-amber-500" },
    "marking-schemes": { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", accent: "bg-emerald-500" },
    "textbooks": { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200", accent: "bg-sky-500" },
    "study-guides": { bg: "bg-violet-50", text: "text-violet-800", border: "border-violet-200", accent: "bg-violet-500" },
    "practice-questions": { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-200", accent: "bg-rose-500" },
};

export default function LibraryPage() {
    const {
        resources, categories, availableFilters,
        currentFilters, bookmarkedSet, totalCount, isFiltering,
    } = useLoaderData<typeof loader>();

    const [searchParams, setSearchParams] = useSearchParams();
    const [filterOpen, setFilterOpen] = useState(false);
    const [localSearch, setLocalSearch] = useState(currentFilters.search ?? "");
    const [bookmarks, setBookmarks] = useState<Record<string, boolean>>(bookmarkedSet);

    // Debounced search
    useEffect(() => {
        const t = setTimeout(() => {
            setSearchParams(prev => {
                const next = new URLSearchParams(prev);
                if (localSearch) next.set("q", localSearch);
                else next.delete("q");
                return next;
            }, { replace: true });
        }, 350);
        return () => clearTimeout(t);
    }, [localSearch]);

    const setFilter = (key: string, value: string | null) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            if (value) next.set(key, value);
            else next.delete(key);
            return next;
        }, { replace: true });
    };

    const clearAll = () => {
        setSearchParams(new URLSearchParams());
        setLocalSearch("");
    };

    const toggleBookmark = (id: string) => {
        setBookmarks(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const activeFilterCount = [
        currentFilters.level,
        currentFilters.subject,
        currentFilters.year,
        currentFilters.category,
        currentFilters.filter !== "all" ? currentFilters.filter : null,
    ].filter(Boolean).length;

    const showCategoryGrid = !isFiltering;

    return (
        <div
            className="min-h-screen pb-28"
            style={{
                background: "linear-gradient(160deg, #fafaf8 0%, #f5f3ee 100%)",
            }}
        >
            {/* ── Hero header ──────────────────────────────────────────────────────── */}
            <header className="bg-white/80 backdrop-blur-md border-b border-stone-200/80 sticky top-0 z-20">
                <div className="max-w-3xl mx-auto px-4 pt-5 pb-3 space-y-3">

                    {/* Title row */}
                    <div className="flex items-end justify-between">
                        <div>
                            <h1
                                className="text-2xl font-bold tracking-tight text-stone-900"
                            >
                                Library
                            </h1>
                            <p className="text-xs text-stone-400 mt-0.5" >
                                {totalCount} resources · past papers, textbooks & more
                            </p>
                        </div>

                        {/* Bookmark toggle */}
                        <button
                            onClick={() => setFilter("filter", currentFilters.filter === "bookmarked" ? null : "bookmarked")}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${currentFilters.filter === "bookmarked"
                                    ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                                    : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
                                }`}
                        >
                            <Bookmark size={13} className={currentFilters.filter === "bookmarked" ? "fill-white" : ""} />
                            Saved
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                            type="search"
                            value={localSearch}
                            onChange={e => setLocalSearch(e.target.value)}
                            placeholder="Search papers, textbooks, subjects…"
                            className="w-full pl-10 pr-10 py-2.5 bg-stone-100/80 rounded-xl text-sm text-stone-800 placeholder:text-stone-400 border border-transparent focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all"
                        />
                        {localSearch && (
                            <button
                                onClick={() => setLocalSearch("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Filter row */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-hide" >
                        {/* Level chips */}
                        {(["olevel", "alevel"] as const).map(l => (
                            <button
                                key={l}
                                onClick={() => setFilter("level", currentFilters.level === l ? null : l)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${currentFilters.level === l
                                        ? l === "olevel"
                                            ? "bg-sky-500 text-white border-sky-500"
                                            : "bg-violet-500 text-white border-violet-500"
                                        : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
                                    }`}
                            >
                                {l === "olevel" ? "O-Level" : "A-Level"}
                            </button>
                        ))}

                        <div className="w-px h-4 bg-stone-200 shrink-0" />

                        {/* Category quick chips */}
                        {categories.slice(0, 3).map(cat => {
                            const cfg = CAT_CONFIG[cat.slug] ?? { bg: "bg-stone-50", text: "text-stone-700", border: "border-stone-200", accent: "bg-stone-400" };
                            const active = currentFilters.category === cat.slug;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setFilter("category", active ? null : cat.slug)}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${active ? `${cfg.bg} ${cfg.text} ${cfg.border}` : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
                                        }`}
                                >
                                    <span>{cat.icon}</span> {cat.name}
                                </button>
                            );
                        })}

                        {/* Advanced filter */}
                        <button
                            onClick={() => setFilterOpen(true)}
                            className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-all shrink-0 ${activeFilterCount > 0
                                    ? "bg-stone-800 text-white border-stone-800"
                                    : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
                                }`}
                        >
                            <SlidersHorizontal size={12} />
                            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                        </button>
                    </div>
                </div>
            </header>


            <main className="max-w-3xl mx-auto px-4 py-6 space-y-8">

                {/* ── Category grid (only when no filters active) ────────────────────── */}
                {showCategoryGrid && (
                    <section>
                        <p
                            className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-3"
                        >
                            Browse by type
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {categories.map((cat, i) => {
                                const cfg = CAT_CONFIG[cat.slug] ?? { bg: "bg-stone-50", text: "text-stone-700", border: "border-stone-200", accent: "bg-stone-400" };
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setFilter("category", cat.slug)}
                                        className={`group relative flex flex-col items-start gap-2 p-4 rounded-2xl border ${cfg.bg} ${cfg.border} hover:shadow-md transition-all duration-200 text-left overflow-hidden`}
                                        style={{ animationDelay: `${i * 60}ms` }}
                                    >
                                        {/* Accent bar */}
                                        <div className={`absolute top-0 left-0 right-0 h-0.5 ${cfg.accent}`} />

                                        <span className="text-2xl">{cat.icon}</span>
                                        <div>
                                            <p className={`text-sm font-bold ${cfg.text}`}>
                                                {cat.name}
                                            </p>
                                            <p className="text-xs text-stone-400 mt-0.5" >
                                                {cat.count} files
                                            </p>
                                        </div>
                                        <div className={`absolute bottom-2 right-3 text-2xl font-black opacity-5 ${cfg.text} pointer-events-none`}>
                                            {cat.count}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* ── Trending strip (only on home view) ────────────────────────────── */}
                {showCategoryGrid && (
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp size={14} className="text-amber-500" />
                            <p
                                className="text-[10px] font-bold tracking-widest text-stone-400 uppercase"
                            >
                                Most downloaded
                            </p>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                            {[...resources]
                                .sort((a, b) => b.downloadCount - a.downloadCount)
                                .slice(0, 5)
                                .map(r => (
                                    <button
                                        key={r.id}
                                        onClick={() => setFilter("category", r.category.slug)}
                                        className="shrink-0 w-44 bg-white border border-stone-200 rounded-xl p-3 text-left hover:border-amber-300 hover:shadow-sm transition-all"
                                    >
                                        <span className="text-lg">{r.category.icon}</span>
                                        <p className="text-xs font-semibold text-stone-800 mt-1.5 line-clamp-2" >
                                            {r.title}
                                        </p>
                                        <p className="text-[10px] text-stone-400 mt-1 flex items-center gap-1" >
                                            <Download size={9} /> {r.downloadCount.toLocaleString()}
                                        </p>
                                    </button>
                                ))}
                        </div>
                    </section>
                )}

                {/* ── Results section ────────────────────────────────────────────────── */}
                <section>
                    {/* Results header */}
                    <div
                        className="flex items-center justify-between mb-4"
                    >
                        <div className="flex items-center gap-2">
                            {isFiltering && (
                                <span className="flex items-center gap-1.5 text-xs text-stone-500">
                                    <Sparkles size={11} className="text-amber-500" />
                                    {resources.length} result{resources.length !== 1 ? "s" : ""}
                                    {currentFilters.search && (
                                        <span className="text-stone-400">for "<strong className="text-stone-700">{currentFilters.search}</strong>"</span>
                                    )}
                                </span>
                            )}
                            {!isFiltering && (
                                <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">
                                    All resources
                                </p>
                            )}
                        </div>
                        {isFiltering && (
                            <button
                                onClick={clearAll}
                                className="text-xs text-amber-600 font-semibold hover:underline"
                            >
                                Clear all
                            </button>
                        )}
                    </div>

                    {/* Resource list */}
                    {resources.length === 0 ? (
                        <div className="text-center py-16 space-y-3">
                            <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto">
                                <FileText size={26} className="text-stone-400" />
                            </div>
                            <p className="font-semibold text-stone-700" >
                                No resources found
                            </p>
                            <p className="text-sm text-stone-400" >
                                Try adjusting your search or filters
                            </p>
                            <button
                                onClick={clearAll}
                                className="mt-2 text-amber-600 text-sm font-semibold hover:underline"
                                
                            >
                                Clear all filters
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {resources.map(r => (
                                <ResourceCard
                                    key={r.id}
                                    resource={r}
                                    isBookmarked={bookmarks[r.id] ?? false}
                                    onBookmarkToggle={() => toggleBookmark(r.id)}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </main>

            {/* ── Filter sheet ────────────────────────────────────────────────────── */}
            <LibraryFilterSheet
                isOpen={filterOpen}
                onClose={() => setFilterOpen(false)}
                categories={categories}
                currentFilters={currentFilters}
                availableFilters={availableFilters}
                onApply={filters => {
                    Object.entries(filters).forEach(([k, v]) => setFilter(k, v as string | null));
                    setFilterOpen(false);
                }}
            />
        </div>
    );
}