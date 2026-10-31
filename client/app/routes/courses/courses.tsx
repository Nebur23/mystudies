import { useState, useEffect } from "react";
import { useLoaderData, useSearchParams, useNavigation } from "react-router";
import { Search, SlidersHorizontal, BookOpen, Trophy, Clock } from "lucide-react";
import { CourseCard } from "~/components/courses/CourseCard";
import type { Route } from "./+types/courses";
import { CourseFilters } from "~/components/courses/CourseFilters";
import { CourseCardSkeleton } from "~/components/courses/CourseCardSkeleton";
import type { Course } from "~/types/course";
import { getSearchedCourses, currentUserProgressPerCourse } from "~/utils/courses";
import { db } from "~/db";
import { course } from "~/db/schema/courses";
import { eq } from "drizzle-orm";
import { requireAuth } from "~/lib/auth.server";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);

  const search = url.searchParams.get("q")?.toLowerCase()?.trim() || "";
  const level = url.searchParams.get("level") || "";
  const subject = url.searchParams.get("subject") || "";
  const filter = url.searchParams.get("filter") || "all";
  const session = await requireAuth(request);
  const courses = await getSearchedCourses(search, level, subject);
  const progressByCourse = await currentUserProgressPerCourse(courses, session);
  const courseProgressMap = Object.fromEntries(progressByCourse);

  const publishedCourses = await db
    .select({ level: course.level, subject: course.subject })
    .from(course)
    .where(eq(course.isPublished, true));

  const availableFilters = {
    levels: [...new Set(publishedCourses.map(c => c.level))].sort(),
    subjects: [...new Set(publishedCourses.map(c => c.subject))].sort(),
  };

  const inProgressCount = courses.filter(c => {
    const progress = courseProgressMap[c.id];
    return progress && progress.total > 0 && progress.completed > 0 && progress.completed < progress.total;
  }).length;

  const completedCount = courses.filter(c => {
    const progress = courseProgressMap[c.id];
    return progress && progress.total > 0 && progress.completed === progress.total;
  }).length;

  // Apply client-side progress filters after capturing the full result summary.
  let filteredCourses = courses;
  if (filter === "enrolled") {
    filteredCourses = courses.filter(c => {
      const p = courseProgressMap[c.id];
      return p && p.total > 0 && p.completed > 0 && p.completed < p.total;
    });
  } else if (filter === "completed") {
    filteredCourses = courses.filter(c => {
      const p = courseProgressMap[c.id];
      return p && p.total > 0 && p.completed === p.total;
    });
  }

  return {
    courses: filteredCourses,
    progressMap: courseProgressMap,
    availableFilters,
    courseStats: {
      inProgress: inProgressCount,
      completed: completedCount,
    },
    currentFilters: { search, level, subject, filter },
  };
}

// ─────────────────────────────────────────────────────────────
// COMPONENT: Course Listing Page
// ────────────────────────────────────────────────────────────
export default function CoursesPage() {
  const { courses, progressMap, availableFilters, courseStats, currentFilters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(currentFilters.search || "");
  const [optimisticFilter, setOptimisticFilter] = useState(currentFilters.filter || null);
  const navigation = useNavigation();

  const currentLoadedFilter = currentFilters.filter || "all";

  const nextFilter =
    new URLSearchParams(navigation.location?.search).get("filter") ||
    currentLoadedFilter;

  const isSwitchingFilter =
    navigation.state !== "idle" &&
    nextFilter !== currentLoadedFilter;

  const [showShimmer, setShowShimmer] = useState(false);
  const isPending = showShimmer;
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isSwitchingFilter) {
      timer = setTimeout(() => {
        setShowShimmer(true);
      }, 120);
    } else {
      requestAnimationFrame(() => {
        setShowShimmer(false);
      });
    }

    return () => {
      clearTimeout(timer);
    };
  }, [isSwitchingFilter, currentLoadedFilter]);


  useEffect(() => {
    setOptimisticFilter(currentFilters.filter || null);
  }, [currentFilters.filter]);

  // Debounced search update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch) {
        setSearchParams(prev => {
          prev.set("q", localSearch);
          return prev;
        });
      } else {
        setSearchParams(prev => {
          prev.delete("q");
          return prev;
        });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, setSearchParams]);

  const handleFilterChange = (
    key: string,
    value: string | null
  ) => {
    // instant UI update
    if (key === "filter") {
      setOptimisticFilter(value);
    }

    setSearchParams(prev => {
      const params = new URLSearchParams(prev);

      if (value && value !== null) {
        params.set(key, value);
      } else {
        params.delete(key);
      }

      return params;
    });
  };

  return (
    <div className="min-h-screen w-full pb-20">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <label htmlFor="course-search" className="sr-only">Search courses</label>
          <div className="relative">
            <Search size={18} aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              id="course-search"
              type="search"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search by subject or course"
              className="w-full rounded-xl border border-border bg-card py-3 pl-11 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { label: "All courses", value: "all" },
              { label: "In progress", value: "enrolled" },
              { label: "Completed", value: "completed" },
            ].map(chip => (
              <button
                key={chip.value}
                type="button"
                aria-pressed={optimisticFilter === chip.value}
                onClick={() => handleFilterChange("filter", chip.value)}
                className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  optimisticFilter === chip.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {chip.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              className="ml-auto flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <SlidersHorizontal size={14} aria-hidden="true" />
              Filters
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 sm:pt-10 lg:px-8">
        <section className="mb-7 flex flex-col gap-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Your learning library</p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Explore courses</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Find a course that fits your subject and exam level, then pick up where you left off.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4 text-sm text-muted-foreground sm:justify-end sm:border-t-0 sm:pt-0">
            {isPending ? (
              <span className="animate-pulse">Updating course results…</span>
            ) : (
              <>
                <span className="inline-flex items-center gap-2">
                  <BookOpen size={16} aria-hidden="true" className="text-primary" />
                  <strong className="font-semibold text-foreground">{courses.length}</strong> results
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock size={16} aria-hidden="true" className="text-primary" />
                  <strong className="font-semibold text-foreground">{courseStats.inProgress}</strong> in progress
                </span>
                <span className="inline-flex items-center gap-2">
                  <Trophy size={16} aria-hidden="true" className="text-primary" />
                  <strong className="font-semibold text-foreground">{courseStats.completed}</strong> completed
                </span>
              </>
            )}
          </div>
        </section>

        {courses.length === 0 ? (
          <section className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
            <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <BookOpen size={22} aria-hidden="true" />
            </span>
            <h2 className="font-semibold text-foreground">No courses found</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Try a different search or remove some filters to see more courses.
            </p>
            <button
              type="button"
              onClick={() => { setSearchParams(new URLSearchParams()); setLocalSearch(""); }}
              className="mt-5 rounded-lg px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Clear all filters
            </button>
          </section>
        ) : (
          <section aria-label="Available courses">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {showShimmer
                ? Array.from({ length: 6 }).map((_, i) => <CourseCardSkeleton key={i} />)
                : courses.map(courseData => (
                    <CourseCard
                      key={courseData.id}
                      course={{
                        ...courseData,
                        description: courseData.description ?? "",
                        thumbnailUrl: courseData.thumbnailUrl ?? undefined,
                      }}
                      progress={progressMap[courseData.id]}
                    />
                  ))}
            </div>
          </section>
        )}
      </main>

      {/* Filter Sheet Modal */}
      <CourseFilters
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        currentFilters={{ "level": currentFilters.level, "subject": currentFilters.subject, "filter": currentFilters.filter }}
        availableFilters={availableFilters}
        onApply={(filters) => {
          setSearchParams(prev => {
            const params = new URLSearchParams(prev);

            Object.entries(filters).forEach(([key, value]) => {
              if (value) {
                params.set(key, value);
              } else {
                params.delete(key);
              }
            });

            return params;
          });
          setIsFilterOpen(false);
        }}
      />
    </div >
  );
}
