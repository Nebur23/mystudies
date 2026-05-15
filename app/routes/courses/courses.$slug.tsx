import { useState, useCallback } from "react";
import { useLoaderData, useRevalidator, Link } from "react-router";
import { ChevronLeft, BookOpen, MessageSquare, CheckCircle2, Clock } from "lucide-react";
import { LessonList } from "~/components/courses/LessonList";
import { CourseNotes } from "~/components/courses/CourseNotes";
import type { Route } from "./+types/courses.$slug";
import { db } from "~/db";
import { course, courseModule, courseLesson, userLessonProgress } from "~/db/schema/courses";
import { requireAuth } from "~/lib/auth";
import { eq, asc, and, inArray } from "drizzle-orm";
import { YouTubePlayer } from "~/components/courses/YouTubePlayer";

// ── Types ─────────────────────────────────────────────────────────────────────
type ProgressEntry = {
  lessonId: string;
  watchedSeconds: number;
  completed: boolean;
  lastWatchedAt: Date | null;
};

type ProgressMap = Record<string, ProgressEntry>;

// ── Loader ────────────────────────────────────────────────────────────────────
export async function loader({ params, request }: Route.LoaderArgs) {
  const session    = await requireAuth(request);
  const currentUserId = session.user.id; 

  const courseData = await db.query.course.findFirst({
    where: eq(course.slug, params.slug),
    with: {
      modules: {
        orderBy: asc(courseModule.order),
        with: { lessons: { orderBy: asc(courseLesson.order) } },
      },
    },
  });

  if (!courseData || !courseData.isPublished) {
    throw new Response("Course not found", { status: 404 });
  }

  const allLessonIds = courseData.modules.flatMap(m => m.lessons.map(l => l.id));

  // ✅ Guard: skip DB query if course has no lessons
  const progressData = allLessonIds.length > 0
    ? await db
        .select()
        .from(userLessonProgress)
        .where(
          and(
            inArray(userLessonProgress.lessonId, allLessonIds),
            eq(userLessonProgress.userId, currentUserId),
          )
        )
    : [];

  const progressMap: ProgressMap = Object.fromEntries(
    progressData.map(p => [p.lessonId, {
      lessonId: p.lessonId,
      watchedSeconds: p.watchedSeconds ?? 0,
      completed: p.completed ?? false,
      lastWatchedAt: p.lastWatchedAt,
    }])
  );

  // First uncompleted lesson
  let nextLessonId: string | null = null;
  outer: for (const mod of courseData.modules) {
    for (const lesson of mod.lessons) {
      if (!progressMap[lesson.id]?.completed) {
        nextLessonId = lesson.id;
        break outer;
      }
    }
  }

  const completedCount  = progressData.filter(p => p.completed).length;
  const totalLessons    = allLessonIds.length;
  const progressPercent = totalLessons > 0
    ? Math.round((completedCount / totalLessons) * 100)
    : 0;

  return {
    course:          courseData,
    progressMap,
    nextLessonId,
    progressPercent,
    totalLessons,
    completedCount,
    currentUserId,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CoursePage() {
  const loaderData = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();

  // ✅ Local progressMap state — updated optimistically on lesson complete
  //    so checkmarks appear instantly without waiting for revalidation
  const [progressMap, setProgressMap] = useState<ProgressMap>(loaderData.progressMap);
  const [completedCount, setCompletedCount] = useState(loaderData.completedCount);

  const [activeLessonId, setActiveLessonId] = useState<string | null>(
    loaderData.nextLessonId ?? loaderData.course.modules[0]?.lessons[0]?.id ?? null
  );
  const [activeTab, setActiveTab] = useState<"lessons" | "notes">("lessons");

  const { course, totalLessons, currentUserId } = loaderData;

  const progressPercent = totalLessons > 0
    ? Math.round((completedCount / totalLessons) * 100)
    : 0;

  // Find active lesson + module
  let activeLesson = null;
  let activeModule = null;
  for (const mod of course.modules) {
    const lesson = mod.lessons.find(l => l.id === activeLessonId);
    if (lesson) { activeLesson = lesson; activeModule = mod; break; }
  }

  const activeProgress = activeLesson ? progressMap[activeLesson.id] : null;

  // ✅ Called by YouTubePlayer when lesson completes — updates local state
  //    immediately so the checkmark appears, then revalidates in background
  const handleLessonComplete = useCallback((lessonId: string, watchedSeconds: number) => {
    setProgressMap(prev => {
      const wasCompleted = prev[lessonId]?.completed;
      const updated = {
        ...prev,
        [lessonId]: {
          lessonId,
          watchedSeconds,
          completed:      true,
          lastWatchedAt:  new Date(),
        },
      };
      if (!wasCompleted) setCompletedCount(c => c + 1);
      return updated;
    });
    // Background revalidation keeps DB and client in sync
    revalidator.revalidate();
  }, [revalidator]);

  // ✅ Track progress update without triggering full revalidation
  const handleProgressUpdate = useCallback((lessonId: string, watchedSeconds: number) => {
    setProgressMap(prev => ({
      ...prev,
      [lessonId]: {
        ...prev[lessonId],
        lessonId,
        watchedSeconds,
        completed:     prev[lessonId]?.completed ?? false,
        lastWatchedAt: new Date(),
      },
    }));
  }, []);

  const handleSelectLesson = (id: string) => {
    setActiveLessonId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            to="/courses"
            className="p-2 hover:bg-slate-100 rounded-full transition-colors shrink-0"
            aria-label="Back to courses"
          >
            <ChevronLeft size={20} className="text-slate-700" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-sm text-slate-900 truncate">{course.title}</h1>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="capitalize">{course.level === "alevel" ? "A-Level" : "O-Level"}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <span>{completedCount}/{totalLessons} lessons</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <span className={progressPercent === 100 ? "text-green-600 font-semibold" : ""}>
                {progressPercent}%
              </span>
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-purple-600 transition-all duration-700"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        {/* ── Video Player ── */}
        {activeLesson ? (
          <div>
            <div className="bg-black">
              <YouTubePlayer
                key={activeLesson.id} 
                videoId={activeLesson.youtubeVideoId}
                lessonId={activeLesson.id}
                initialWatched={activeProgress?.watchedSeconds ?? 0}
                isCompleted={activeProgress?.completed ?? false}
                onComplete={handleLessonComplete}
                onProgress={handleProgressUpdate}
              />
            </div>

            {/* Lesson info */}
            <div className="bg-white px-4 py-3 border-b border-slate-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-bold text-base text-slate-900 leading-snug">
                    {activeLesson.title}
                  </h2>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {Math.round((activeLesson.duration ?? 0) / 60)} min
                    </span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">
                      {activeModule?.title}
                    </span>
                  </div>
                </div>
                {(activeProgress?.completed) && (
                  <span className="flex items-center gap-1 text-green-600 font-semibold text-xs whitespace-nowrap">
                    <CheckCircle2 size={14} /> Completed
                  </span>
                )}
              </div>

              {/* Resources row */}
              {activeLesson.resources && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {activeLesson.resources.pdfUrl && (
                    <a
                      href={activeLesson.resources.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 font-medium transition-colors"
                    >
                      📄 Download Notes
                    </a>
                  )}
                  {activeLesson.resources.practiceQuizId && (
                    <Link
                      to={`/practice/${activeLesson.resources.practiceQuizId}`}
                      className="text-xs px-3 py-1.5 bg-purple-100 hover:bg-purple-200 rounded-full text-purple-700 font-medium transition-colors"
                    >
                      🎯 Practice Quiz
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="aspect-video bg-slate-200 flex items-center justify-center">
            <p className="text-slate-500 text-sm">Select a lesson to start</p>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="sticky top-14 bg-white z-10 border-b border-slate-200">
          <div className="flex max-w-4xl mx-auto">
            {(["lessons", "notes"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
                  activeTab === tab
                    ? "border-purple-600 text-purple-700"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab === "lessons" ? <BookOpen size={15} /> : <MessageSquare size={15} />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab Content ── */}
        <div className="p-4">
          {activeTab === "lessons" ? (
            <LessonList
              modules={course.modules}
              progressMap={progressMap}
              activeLessonId={activeLessonId}
              onSelectLesson={handleSelectLesson}
            />
          ) : (
            <CourseNotes
              lessonId={activeLessonId ?? ""}
              lessonTitle={activeLesson?.title ?? ""}
              userId={currentUserId}
            />
          )}
        </div>
      </main>
    </div>
  );
}