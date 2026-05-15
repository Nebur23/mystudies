import { useState, useEffect } from "react";
import { useLoaderData, useSearchParams } from "react-router";
import { Search, SlidersHorizontal, BookOpen, Trophy, Clock, ChevronRight } from "lucide-react";
import { CourseCard } from "~/components/courses/CourseCard";
import type { Route } from "./+types/courses";
import { db } from "~/db";
import { course, userLessonProgress, courseLesson, courseModule } from "~/db/schema/courses";
import { requireAuth } from "~/lib/auth";
import { eq, asc, sql, and, inArray, like } from "drizzle-orm";
import { CourseFilters } from "~/components/courses/CourseFilters";

// ─────────────────────────────────────────────────────────────
// LOADER: Fetches courses + user progress
// ─────────────────────────────────────────────────────────────
export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request);
  const url = new URL(request.url);
  
  // Query params
  const search = url.searchParams.get("q")?.toLowerCase() || "";
  const level = url.searchParams.get("level"); // "olevel" | "alevel"
  const subject = url.searchParams.get("subject");
  const filter = url.searchParams.get("filter") || "all"; // all | enrolled | completed
  
  // 1. Fetch Published Courses (with optional filters)
  const courseConditions = [eq(course.isPublished, true)];
  
  if (search) {
    courseConditions.push(
      sql`lower(${course.title}) LIKE ${`%${search}%`}`
    );
  }
  if (level) {
    courseConditions.push(eq(course.level, level as "olevel" | "alevel"));
  }
  if (subject) {
    courseConditions.push(eq(course.subject, subject));
  }
  
  const courses = await db.query.course.findMany({
    where: and(...courseConditions),
    orderBy: asc(course.title),
    columns: {
      id: true,
      title: true,
      slug: true,
      description: true,
      thumbnailUrl: true,
      level: true,
      subject: true,
    }
  });

  // 2. Fetch User Progress for ALL lessons in these courses
  // (Efficient single query instead of N+1)
  const courseIds = courses.map(c => c.id);
  
  let progressData: { id: string; userId: string; lessonId: string; watchedSeconds: number | null; completed: boolean | null; lastWatchedAt: Date | null; }[] = [];
  let allLessonIds: { id: string; courseId: string; }[] = [];
  if (courseIds.length > 0) {
    // Get all lesson IDs for these courses first
    const lessons = await db.query.courseLesson.findMany({
      where: inArray(courseLesson.moduleId, 
        // Subquery: get module IDs for these courses
        db.select({ id: courseModule.id })
          .from(courseModule)
          .where(inArray(courseModule.courseId, courseIds))
      ),
      columns: { id: true, courseId: true } // Note: need to join to get courseId
    });
    
    // Better approach: Join courseLesson -> courseModule -> course
    allLessonIds = await db
      .select({ id: courseLesson.id, courseId: courseModule.courseId })
      .from(courseLesson)
      .innerJoin(courseModule, eq(courseLesson.moduleId, courseModule.id))
      .where(inArray(courseModule.courseId, courseIds));
    
    const lessonIds = allLessonIds.map(l => l.id);
    const lessonCourseMap = new Map(allLessonIds.map(l => [l.id, l.courseId]));
    
    if (lessonIds.length > 0) {
      progressData = await db.query.userLessonProgress.findMany({
        where: and(
          inArray(userLessonProgress.lessonId, lessonIds),
          eq(userLessonProgress.userId, session.user.id)
        )
      });
    }
  }
  
  // 3. Calculate progress per course
  const courseProgressMap = new Map<string, { completed: number; total: number }>();
  
  for (const c of courses) {
    const courseLessons = allLessonIds.filter((l: { courseId: string; }) => l.courseId === c.id);
    const total = courseLessons.length;
    const completed = progressData.filter(
      p => courseLessons.some((l: { id: any; }) => l.id === p.lessonId) && p.completed
    ).length;
    
    courseProgressMap.set(c.id, { completed, total });
  }
  
  // 4. Apply client-side filters (enrolled/completed)
  let filteredCourses = courses;
  if (filter === "enrolled") {
    filteredCourses = courses.filter(c => {
      const p = courseProgressMap.get(c.id);
      return p && p.total > 0 && p.completed < p.total;
    });
  } else if (filter === "completed") {
    filteredCourses = courses.filter(c => {
      const p = courseProgressMap.get(c.id);
      return p && p.total > 0 && p.completed === p.total;
    });
  }
  
  // 5. Get unique subjects/levels for filter dropdowns
  const allCourses = await db.query.course.findMany({
    where: eq(course.isPublished, true),
    columns: { level: true, subject: true }
  });
  
  const availableFilters = {
    levels: [...new Set(allCourses.map(c => c.level))],
    subjects: [...new Set(allCourses.map(c => c.subject))],
  };

  return {
    courses: filteredCourses,
    progressMap: Object.fromEntries(courseProgressMap),
    availableFilters,
    currentFilters: { search, level, subject, filter },
  };
}

// ─────────────────────────────────────────────────────────────
// COMPONENT: Course Listing Page
// ────────────────────────────────────────────────────────────
export default function CoursesPage() {
  const { courses, progressMap, availableFilters, currentFilters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(currentFilters.search || "");
  
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
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearch, setSearchParams]);
  
  const handleFilterChange = (key: string, value: string | null) => {
    setSearchParams(prev => {
      if (value) prev.set(key, value);
      else prev.delete(key);
      return prev;
    });
  };
  
  // Calculate stats
  const enrolledCount = courses.filter(c => {
    const p = progressMap[c.id];
    return p && p.total > 0 && p.completed < p.total;
  }).length;
  
  const completedCount = courses.filter(c => {
    const p = progressMap[c.id];
    return p && p.total > 0 && p.completed === p.total;
  }).length;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="font-bold text-xl text-slate-900 mb-4">Courses</h1>
          
          {/* Search Bar */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search calculus, physics..."
              className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-transparent rounded-xl text-sm focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
            />
          </div>
          
          {/* Filter Chips + Button */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
            {/* Quick Filter Chips */}
            {[
              { key: "filter", label: "All", value: null },
              { key: "filter", label: "Enrolled", value: "enrolled" },
              { key: "filter", label: "Completed", value: "completed" },
            ].map(chip => (
              <button
                key={chip.label}
                onClick={() => handleFilterChange(chip.key, chip.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  (currentFilters.filter || null) === chip.value
                    ? "bg-purple-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {chip.label}
              </button>
            ))}
            
            {/* Advanced Filter Button */}
            <button
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 whitespace-nowrap ml-auto"
            >
              <SlidersHorizontal size={14} /> Filters
            </button>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="max-w-lg mx-auto px-4 py-3">
        <div className="flex gap-3 text-xs text-slate-600">
          <span className="flex items-center gap-1">
            <BookOpen size={14} /> {courses.length} courses
          </span>
          <span className="w-1 h-1 bg-slate-300 rounded-full" />
          <span className="flex items-center gap-1">
            <Clock size={14} /> {enrolledCount} in progress
          </span>
          <span className="w-1 h-1 bg-slate-300 rounded-full" />
          <span className="flex items-center gap-1">
            <Trophy size={14} /> {completedCount} completed
          </span>
        </div>
      </div>

      {/* Course Grid */}
      <main className="max-w-lg mx-auto px-4 py-2">
        {courses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">No courses found</p>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filters</p>
            <button 
              onClick={() => {
                setSearchParams(new URLSearchParams());
                setLocalSearch("");
              }}
              className="mt-4 text-purple-600 text-sm font-medium hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {courses.map(courseData => (
              <CourseCard
                key={courseData.id}
                course={{
                  ...courseData,
                  description: courseData.description ?? "",
                  thumbnailUrl: courseData.thumbnailUrl ?? undefined
                }}
                progress={progressMap[courseData.id]}
              />
            ))}
          </div>
        )}
      </main>

      {/* Filter Sheet Modal */}
      <CourseFilters
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        currentFilters={currentFilters}
        availableFilters={availableFilters}
        onApply={(filters: { [s: string]: unknown; } | ArrayLike<unknown>) => {
          Object.entries(filters).forEach(([key, value]) => {
            handleFilterChange(key, value as string | null);
          });
          setIsFilterOpen(false);
        }}
      />
    </div>
  );
}