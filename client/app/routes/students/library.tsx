import { useState, useEffect, useRef, useCallback } from "react";
import { useLoaderData, useSearchParams, Link } from "react-router";
import {
    Search, SlidersHorizontal, BookOpen, FileText,
    Download, Bookmark, X, TrendingUp, Sparkles, ArrowRight,
} from "lucide-react";
import { ResourceCard } from "~/components/library/ResourceCard";
import { LibraryFilterSheet } from "~/components/library/LibraryFilterSheet";
import { db } from "~/db";
import { resource, resourceCategory, resourceBookmark } from "~/db/schema/library";
import { requireAuth } from "~/lib/auth";
import { eq, and, or, asc, inArray, sql } from "drizzle-orm";

// ── SVG category illustrations ────────────────────────────────────────────────
import Paper from "~/assets/library/paper.svg";
import Textbooks from "~/assets/library/Placeholder book.svg";
import StudyGuide from "~/assets/library/guide.svg";
import Pamphlet from "~/assets/library/pamphlet.svg";
import MakingSchema from "~/assets/library/solutions.svg";
import Syllabus from "~/assets/library/syllabus.svg";
import Practice from "~/assets/library/Yellow Quiz.svg";
import type { Route } from "./+types/library";

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

// ── Loader  ────────────────────────────────────────────────────────
export async function loader({ request }: Route.LoaderArgs) {
    const session = await requireAuth(request);
    const url = new URL(request.url);

    const search = url.searchParams.get("q")?.trim() ?? "";
    const category = url.searchParams.get("category") ?? "";
    const level = url.searchParams.get("level") ?? "";
    const subject = url.searchParams.get("subject") ?? "";
    const year = url.searchParams.get("year") ?? "";
    const filter = url.searchParams.get("filter") ?? "all";

    const categories = await db
        .select({
            id: resourceCategory.id,
            name: resourceCategory.name,
            slug: resourceCategory.slug,
            icon: resourceCategory.icon,
            order: resourceCategory.order,
            count: sql<number>`COUNT(${resource.id})::int`,
        })
        .from(resourceCategory)
        .leftJoin(resource, and(
            eq(resource.categoryId, resourceCategory.id),
            eq(resource.isPublished, true),
        ))
        .groupBy(resourceCategory.id)
        .orderBy(asc(resourceCategory.order));

    const userBookmarks = await db
        .select({ resourceId: resourceBookmark.resourceId })
        .from(resourceBookmark)
        .where(eq(resourceBookmark.userId, session.user.id));

    const bookmarkedIds = new Set(userBookmarks.map(b => b.resourceId));

    const conditions = [eq(resource.isPublished, true)];

    if (search) {
        conditions.push(
            or(
                sql`search_vector @@ websearch_to_tsquery('english', unaccent(${search}))`,
                sql`(
                    coalesce(${resource.title}, '') || ' ' ||
                    coalesce(${resource.subject}, '') || ' ' ||
                    coalesce(${resource.description}, '')
                ) % ${search}`,
            )!
        );
    }

    if (category) conditions.push(eq(resourceCategory.slug, category));
    if (level) conditions.push(eq(resource.level, level as "olevel" | "alevel" | "both"));
    if (subject) conditions.push(eq(resource.subject, subject));
    if (year) conditions.push(eq(resource.year, parseInt(year)));

    if (filter === "bookmarked") {
        conditions.push(
            bookmarkedIds.size > 0
                ? inArray(resource.id, [...bookmarkedIds])
                : sql`false`
        );
    }

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

    const resources = await db
        .select({
            id: resource.id,
            title: resource.title,
            slug: resource.slug,
            description: resource.description,
            level: resource.level,
            subject: resource.subject,
            year: resource.year,
            fileType: resource.fileType,
            fileSize: resource.fileSize,
            downloadCount: resource.downloadCount,
            isPremium: resource.isPremium,
            thumbnailUrl: resource.thumbnailUrl,
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

    const allMeta = await db
        .select({ subject: resource.subject, year: resource.year })
        .from(resource)
        .where(eq(resource.isPublished, true));

    const availableFilters = {
        subjects: [...new Set(allMeta.map(r => r.subject))].sort(),
        years: [...new Set(allMeta.map(r => r.year).filter(Boolean) as number[])].sort((a, b) => b - a),
    };

    const isFiltering = !!(search || category || level || subject || year || filter !== "all");

    return {
        resources,
        categories,
        availableFilters,
        currentFilters: { search, category, level, subject, year, filter },
        bookmarkedSet: Object.fromEntries([...bookmarkedIds].map(id => [id, true])),
        totalCount: resources.length,
        isFiltering,
    };
}

// ── Category config ───────────────────────────────────────────────────────────
const CAT_CONFIG: Record<string, { bg: string; text: string; border: string; accent: string }> = {
    "past-papers": { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", accent: "bg-amber-500" },
    "marking-schemes": { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", accent: "bg-emerald-500" },
    "textbooks": { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200", accent: "bg-sky-500" },
    "study-guides": { bg: "bg-violet-50", text: "text-violet-800", border: "border-violet-200", accent: "bg-violet-500" },
    "practice-questions": { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-200", accent: "bg-rose-500" },
    "syllabus": { bg: "bg-teal-50", text: "text-teal-800", border: "border-teal-200", accent: "bg-teal-500" },
    "pamphlets": { bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-200", accent: "bg-orange-500" },
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LibraryPage() {
    const {
        resources, categories, availableFilters,
        currentFilters, bookmarkedSet, totalCount, isFiltering,
    } = useLoaderData<typeof loader>();

    const [searchParams, setSearchParams] = useSearchParams();
    const [filterOpen, setFilterOpen] = useState(false);
    const [localSearch, setLocalSearch] = useState(currentFilters.search ?? "");
    const [bookmarks, setBookmarks] = useState<Record<string, boolean>>(bookmarkedSet as Record<string, boolean>);

    // ✅ Track whether the user has typed (prevents firing on initial mount)
    const hasTyped = useRef(false);

    useEffect(() => {
        if (!hasTyped.current) return; // skip the very first render
        const t = setTimeout(() => {
            setSearchParams(prev => {
                const next = new URLSearchParams(prev);
                if (localSearch) next.set("q", localSearch);
                else next.delete("q");
                return next;
            }, { replace: true });
        }, 350);
        return () => clearTimeout(t);
    }, [localSearch, setSearchParams]);

    useEffect(() => {
        setLocalSearch(currentFilters.search ?? "");
    }, [currentFilters.search]);

    const handleSearchChange = (value: string) => {
        hasTyped.current = true;
        setLocalSearch(value);
    };

    const setFilter = (key: string, value: string | null) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            if (value) next.set(key, value);
            else next.delete(key);
            return next;
        }, { replace: true });
    };

    const clearAll = () => {
        hasTyped.current = false;
        setSearchParams(new URLSearchParams());
        setLocalSearch("");
    };

    const setBookmark = useCallback((id: string, bookmarked: boolean) => {
        setBookmarks(prev => ({ ...prev, [id]: bookmarked }));
    }, []);

    const activeFilterCount = [
        currentFilters.level,
        currentFilters.subject,
        currentFilters.year,
        currentFilters.category,
        currentFilters.filter !== "all" ? currentFilters.filter : null,
        currentFilters.search,
    ].filter(Boolean).length;

    const showCategoryGrid = !isFiltering;

    return (
        <div
            className="min-h-screen bg-background pb-20"
        >
            {/* ── Sticky header ────────────────────────────────────────────── */}
            <header className="sticky top-0 z-20 border-b border-border bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/85">
                <div className="mx-auto max-w-7xl space-y-3 px-4 pb-3 pt-4 sm:px-6 lg:px-8">

                    {/* Title row */}
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                Library
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Explore past papers, textbooks, and study guides
                            </p>
                        </div>
                        <button
                            type="button"
                            aria-pressed={currentFilters.filter === "bookmarked"}
                            onClick={() => setFilter("filter", currentFilters.filter === "bookmarked" ? null : "bookmarked")}
                            className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all ${currentFilters.filter === "bookmarked"
                                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                                }`}
                        >
                        <Bookmark size={13} aria-hidden="true" className={currentFilters.filter === "bookmarked" ? "fill-current" : ""} />
                            Saved
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative hidden">
                        <label htmlFor="library-search" className="sr-only">Search library resources</label>
                        <Search size={16} aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            id="library-search"
                            type="search"
                            value={localSearch}
                            onChange={e => handleSearchChange(e.target.value)}
                            placeholder="Search papers, textbooks, subjects…"
                            className="w-full rounded-xl border border-border bg-card py-3.5 pl-10 pr-10 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
                        />
                        {localSearch && (
                            <button
                                type="button"
                                aria-label="Clear search"
                                onClick={() => { hasTyped.current = true; setLocalSearch(""); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* ✅ YouTube-style horizontal pill filters — no dividers */}
                    <div className="flex gap-2 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {/* Level chips */}
                        {(["olevel", "alevel"] as const).map(l => (
                            <button
                                key={l}
                                type="button"
                                aria-pressed={currentFilters.level === l}
                                onClick={() => setFilter("level", currentFilters.level === l ? null : l)}
                                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${currentFilters.level === l
                                        ? l === "olevel"
                                            ? "bg-sky-500 text-white border-sky-500"
                                            : "bg-violet-500 text-white border-violet-500"
                                        : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
                                    }`}
                            >
                                {l === "olevel" ? "O-Level" : "A-Level"}
                            </button>
                        ))}

                        {/* Category chips */}
                        {categories.map(cat => {
                            const cfg = CAT_CONFIG[cat.slug] ?? { bg: "bg-stone-50", text: "text-stone-700", border: "border-stone-200" };
                            const active = currentFilters.category === cat.slug;
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => setFilter("category", active ? null : cat.slug)}
                                    className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${active
                                            ? `${cfg.bg} ${cfg.text} ${cfg.border} shadow-sm`
                                            : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
                                        }`}
                                >
                                    {/* ✅ Small SVG illustration as chip icon */}
                                    {CAT_ILLUSTRATION[cat.slug] && (
                                        <img
                                            src={CAT_ILLUSTRATION[cat.slug]}
                                            alt=""
                                            className="w-4 h-4 object-contain"
                                        />
                                    )}
                                    {cat.name}
                                </button>
                            );
                        })}

                        {/* Filters button — always last, no ml-auto (scroll container) */}
                        <button
                            type="button"
                            aria-label="Open library filters"
                            onClick={() => setFilterOpen(true)}
                            className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-all ${activeFilterCount > 0
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

            <main className="mx-auto max-w-7xl space-y-10 px-4 py-7 sm:px-6 lg:px-8">

                {/* ── Category grid ──────────────────────────────────────────── */}
                {showCategoryGrid && (
                    <section>
                        <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                            Browse by type
                        </p>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {categories.map((cat, i) => {
                                const cfg = CAT_CONFIG[cat.slug] ?? { bg: "bg-stone-50", text: "text-stone-700", border: "border-stone-200", accent: "bg-stone-400" };
                                const illustration = CAT_ILLUSTRATION[cat.slug];
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setFilter("category", cat.slug)}
                                        className={`group relative flex min-h-[140px] flex-col justify-between overflow-hidden rounded-2xl border p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${cfg.bg} ${cfg.border}`}
                                    >
                                        {/* Accent bar */}
                                        <div className={`absolute top-0 left-0 right-0 h-0.5 ${cfg.accent}`} />

                                        {/* ✅ SVG illustration — replaces emoji */}
                                        {illustration ? (
                                            <img
                                                src={illustration}
                                                alt=""
                                                className="w-10 h-10 object-contain"
                                            />
                                        ) : (
                                            <span className="text-2xl">{cat.icon}</span>
                                        )}

                                        <div>
                                            <p className={`text-sm font-bold ${cfg.text}`}>
                                                {cat.name}
                                            </p>
                                            <p className="text-xs text-stone-400 mt-0.5">
                                                {cat.count} files
                                            </p>
                                        </div>

                                        {/* Ghost count watermark */}
                                        <span className={`absolute bottom-2 right-3 text-3xl font-black opacity-[0.04] ${cfg.text} pointer-events-none select-none`}>
                                            {cat.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* ── Trending horizontal scroll ──────────────────────────────── */}
                {showCategoryGrid && resources.length > 0 && (
                    <section className="hidden">
                        <div className="flex items-center justify-between mb-3 ">
                            <div className="flex items-center gap-2">
                                <TrendingUp size={14} className="text-amber-500" />
                                <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">
                                    Most downloaded
                                </p>
                            </div>
                        </div>

                        {/* ✅ Horizontal card scroll — no vertical list */}
                        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                            {[...resources]
                                .sort((a, b) => b.downloadCount - a.downloadCount)
                                .slice(0, 8)
                                .map(r => {
                                    const illustration = CAT_ILLUSTRATION[r.category.slug];
                                    return (
                                        <Link
                                            key={r.id}
                                            to={`/library/${r.slug}`}
                                            className="shrink-0 w-40 bg-white border border-stone-200 rounded-2xl p-3.5 text-left hover:border-amber-300 hover:shadow-sm transition-all flex flex-col gap-2"
                                        >
                                            {/* Illustration */}
                                            <div className="w-9 h-9">
                                                {illustration
                                                    ? <img src={illustration} alt="" className="w-full h-full object-contain" />
                                                    : <span className="text-2xl">{r.category.icon}</span>
                                                }
                                            </div>

                                            {/* Title */}
                                            <p className="text-xs font-semibold text-stone-800 line-clamp-2 leading-snug flex-1">
                                                {r.title}
                                            </p>

                                            {/* Meta */}
                                            <div className="flex items-center justify-between mt-auto">
                                                <span className="text-[10px] text-stone-400 flex items-center gap-0.5">
                                                    <Download size={9} /> {r.downloadCount.toLocaleString()}
                                                </span>
                                                {r.isPremium && (
                                                    <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                                                        PRO
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    );
                                })}
                        </div>
                    </section>
                )}

                {/* ── Results ────────────────────────────────────────────────── */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        {isFiltering ? (
                            <span className="flex items-center gap-1.5 text-xs text-stone-500">
                                <Sparkles size={11} className="text-amber-500" />
                                {resources.length} result{resources.length !== 1 ? "s" : ""}
                                {currentFilters.search && (
                                    <span className="text-stone-400">
                                        {" "}for "<strong className="text-stone-700">{currentFilters.search}</strong>"
                                    </span>
                                )}
                            </span>
                        ) : (
                            <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">
                                All resources
                            </p>
                        )}
                        {isFiltering && (
                            <button
                                type="button"
                                onClick={clearAll}
                                className="text-xs text-amber-600 font-semibold hover:underline"
                            >
                                Clear all
                            </button>
                        )}
                    </div>

                    {resources.length === 0 ? (
                        <div className="space-y-3 rounded-3xl border border-dashed border-border bg-card/60 px-5 py-16 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                                <FileText size={26} className="text-stone-400" />
                            </div>
                            <p className="font-semibold text-foreground">No resources found</p>
                            <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
                            <button
                                type="button"
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
                                    onBookmarkToggle={setBookmark}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </main>

            <LibraryFilterSheet
                isOpen={filterOpen}
                onClose={() => setFilterOpen(false)}
                categories={categories}
                currentFilters={currentFilters}
                availableFilters={availableFilters}
                onApply={filters => {
                    setSearchParams(previous => {
                        const next = new URLSearchParams(previous);
                        Object.entries(filters).forEach(([key, value]) => {
                            if (value) next.set(key, value);
                            else next.delete(key);
                        });
                        return next;
                    }, { replace: true });
                    setFilterOpen(false);
                }}
            />
        </div>
    );
}