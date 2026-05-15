import { useState, useEffect, useMemo } from "react";
import { useLoaderData, useSearchParams, useNavigation } from "react-router";
import { Search, SlidersHorizontal, X, Users, AlertCircle } from "lucide-react";
import { StudentCard } from "~/components/discovery/StudentCard";
import { StudentCardSkeleton } from "~/components/discovery/StudentCardSkeleton";
import { FilterSheet } from "~/components/discovery/FilterSheet";
import { getSuggestions } from "~/utils/discovery/suggestions";
import { searchStudents } from "~/utils/discovery/search";
import { requireAuth } from "~/lib/auth.server";
import type { Route } from "./+types/discover";

export async function loader({ request }: Route.LoaderArgs) {
    const session = await requireAuth(request);
    const [suggestions, searchResults] = await Promise.all([
        getSuggestions(session.user.id),
        searchStudents({ request }),
    ]);
    return { suggestions, searchResults };
}

export default function DiscoverPage() {
    const { suggestions, searchResults } = useLoaderData<typeof loader>();
    const navigation = useNavigation();

    // True while the loader is rerunning (user typed / changed filters)
    const isLoading = navigation.state === "loading";

    const [searchParams, setSearchParams] = useSearchParams();
    const [query, setQuery] = useState(searchParams.get("q") ?? "");
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                if (query) next.set("q", query);
                else next.delete("q");
                return next;
            }, { replace: true });
        }, 400);
        return () => clearTimeout(timer);
    }, [query, setSearchParams]);

    useEffect(() => {
        const urlQ = searchParams.get("q") ?? "";
        if (urlQ !== query) setQuery(urlQ);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const activeFilters = useMemo(() => ({
        level: searchParams.get("level") ?? undefined,
        region: searchParams.get("region") ?? undefined,
        subject: searchParams.get("subject") ?? undefined,
    }), [searchParams]);

    const hasActiveFilters = useMemo(
        () => Object.values(activeFilters).some(Boolean),
        [activeFilters]
    );

    const removeFilter = (key: string) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.delete(key);
            return next;
        }, { replace: true });
    };

    const clearFilters = () => {
        setSearchParams(() => {
            const next = new URLSearchParams();
            if (query) next.set("q", query);
            return next;
        }, { replace: true });
    };

    const applyFilters = (filters: Record<string, string | undefined>) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            Object.entries(filters).forEach(([key, value]) => {
                if (value) next.set(key, value);
                else next.delete(key);
            });
            return next;
        }, { replace: true });
        setIsFilterOpen(false);
    };

    const isSearching = !!query || hasActiveFilters;

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* ── Header ── */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
                <div className="max-w-lg mx-auto px-4 py-3">
                    <h1 className="font-bold text-lg text-slate-900 mb-3">Discover Students</h1>

                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search by name, school, or subject..."
                                className="w-full pl-10 pr-9 py-2.5 bg-slate-100 border border-transparent rounded-xl text-sm focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                            />
                            {query && (
                                <button
                                    onClick={() => setQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    aria-label="Clear search"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => setIsFilterOpen(true)}
                            className={`p-2.5 rounded-xl border transition-colors ${
                                hasActiveFilters
                                    ? "bg-purple-100 border-purple-300 text-purple-700"
                                    : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                            }`}
                            aria-label="Open filters"
                        >
                            <SlidersHorizontal size={20} />
                        </button>
                    </div>

                    {hasActiveFilters && (
                        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
                            {Object.entries(activeFilters).map(([key, value]) =>
                                value ? (
                                    <span key={key} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium whitespace-nowrap">
                                        {key === "level" ? (value === "olevel" ? "O-Level" : "A-Level") : value}
                                        <button onClick={() => removeFilter(key)} aria-label={`Remove ${key} filter`}>
                                            <X size={12} />
                                        </button>
                                    </span>
                                ) : null
                            )}
                            <button onClick={clearFilters} className="text-xs text-slate-500 underline whitespace-nowrap">
                                Clear all
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-4 space-y-6">

                {/* ── Validation error ── */}
                {searchResults.error && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        <AlertCircle size={16} className="shrink-0" />
                        {searchResults.error}
                    </div>
                )}

                {/* ── Suggestions — hidden while searching or loading ── */}
                {!isSearching && !isLoading && suggestions.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                                <Users size={18} className="text-purple-600" />
                                Suggested for You
                            </h2>
                            <span className="text-xs text-slate-500">{suggestions.length} matches</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {suggestions.map((user: any) => (
                                <StudentCard key={user.userId} user={user} compact />
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Results section ── */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-semibold text-slate-900">
                            {query ? `Results for "${query}"` : "All Public Students"}
                        </h2>
                        {!isLoading && (
                            <span className="text-xs text-slate-500">
                                {searchResults.total ?? searchResults.results.length} found
                            </span>
                        )}
                    </div>

                    {/* Skeleton while loader is running */}
                    {isLoading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <StudentCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : searchResults.results.length === 0 ? (
                        <div className="text-center py-12">
                            <Search size={48} className="mx-auto text-slate-300 mb-3" />
                            <p className="text-slate-600 font-medium">No students found</p>
                            <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filters</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {searchResults.results.map((user: any) => (
                                <StudentCard key={user.userId} user={user} />
                            ))}
                        </div>
                    )}

                    {!isLoading && searchResults.hasNextPage && (
                        <button className="w-full py-3 mt-4 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                            Load More
                        </button>
                    )}
                </section>
            </main>

            <FilterSheet
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                currentFilters={activeFilters}
                onApply={applyFilters}
            />
        </div>
    );
}
