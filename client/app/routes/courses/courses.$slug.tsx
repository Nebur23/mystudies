import { useState, useCallback } from "react";
import { useLoaderData, useRevalidator, Link, redirect } from "react-router";
import { usePostHog } from "@posthog/react";
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  Clock,
  FileText,
  ListChecks,
  MessageSquare,
} from "lucide-react";
import { LessonList } from "~/components/courses/LessonList";
import { CourseNotes } from "~/components/courses/CourseNotes";
import type { Route } from "./+types/courses.$slug";
import { YouTubePlayer } from "~/components/courses/YouTubePlayer";

// ── Types ─────────────────────────────────────────────────────────────────────
type ProgressEntry = {
  lessonId: string;
  watchedSeconds: number;
  completed: boolean;
  lastWatchedAt: string | Date | null;
};

type ProgressMap = Record<string, ProgressEntry>;
type CourseDetails = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  level: "olevel" | "alevel";
  subject: string;
  modules: {
    id: string;
    title: string;
    order: number;
    lessons: {
      id: string;
      title: string;
      youtubeVideoId: string;
      duration: number | null;
      order: number;
      resources: { pdfUrl?: string; practiceQuizId?: string } | null;
    }[];
  }[];
};
type CourseDetailsResponse = {
  course: CourseDetails;
  progressMap: ProgressMap;
  nextLessonId: string | null;
  progressPercent: number;
  totalLessons: number;
  completedCount: number;
  currentUserId: string;
};

// ── Loader ────────────────────────────────────────────────────────────────────
export async function loader({ params, request }: Route.LoaderArgs) {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL must be configured to load course details.");
  }

  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  const response = await fetch(
    new URL(`/courses/by-slug/${encodeURIComponent(params.slug)}`, apiUrl),
    { headers, cache: "no-store" },
  );

  if (response.status === 401) {
    const requestUrl = new URL(request.url);
    const redirectTo = `${requestUrl.pathname}${requestUrl.search}`;
    throw redirect(`/sign-in?redirect=${encodeURIComponent(redirectTo)}`);
  }
  if (response.status === 404) {
    throw new Response("Course not found", { status: 404 });
  }
  if (!response.ok) {
    throw new Response("Unable to load course details", { status: 502 });
  }

  return await response.json() as CourseDetailsResponse;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CoursePage() {
  const loaderData = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const posthog = usePostHog();

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
  const activeLessonNumber = activeLesson
    ? course.modules.flatMap(module => module.lessons).findIndex(lesson => lesson.id === activeLesson.id) + 1
    : 0;

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
          completed: true,
          lastWatchedAt: new Date(),
        },
      };
      if (!wasCompleted) {
        setCompletedCount(c => c + 1);
        posthog?.capture("lesson_completed", {
          lesson_id: lessonId,
          course_slug: course.slug,
          course_title: course.title,
          watched_seconds: watchedSeconds,
        });
      }
      return updated;
    });
    // Background revalidation keeps DB and client in sync
    revalidator.revalidate();
  }, [revalidator, posthog, course.slug, course.title]);

  // ✅ Track progress update without triggering full revalidation
  const handleProgressUpdate = useCallback((lessonId: string, watchedSeconds: number) => {
    setProgressMap(prev => ({
      ...prev,
      [lessonId]: {
        ...prev[lessonId],
        lessonId,
        watchedSeconds,
        completed: prev[lessonId]?.completed ?? false,
        lastWatchedAt: new Date(),
      },
    }));
  }, []);

  const handleSelectLesson = (id: string) => {
    posthog?.capture("lesson_selected", {
      lesson_id: id,
      course_slug: course.slug,
      course_title: course.title,
    });
    setActiveLessonId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              to="/courses"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg pr-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <span className="flex size-9 items-center justify-center rounded-full border border-border bg-background">
                <ChevronLeft size={18} aria-hidden="true" />
              </span>
              All courses
            </Link>
            <div className="flex min-w-52 flex-1 items-center gap-3 sm:max-w-sm">
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                  <span className="font-medium text-muted-foreground">Course progress</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {completedCount}/{totalLessons} lessons · {progressPercent}%
                  </span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-label="Course progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progressPercent}
                >
                  <div
                    className="h-full rounded-full bg-secondary transition-[width] duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
              {progressPercent === 100 && (
                <CheckCircle2 size={20} aria-label="Course completed" className="shrink-0 text-secondary" />
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="py-6 sm:py-8">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">
              {course.level === "alevel" ? "A-Level" : "O-Level"}
            </span>
            <span aria-hidden="true">·</span>
            <span>{course.subject}</span>
          </div>
          <h1 className="mt-3 max-w-4xl text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {course.title}
          </h1>
          {course.description && (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
              {course.description}
            </p>
          )}
        </section>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.9fr)]">
          <section aria-label="Current lesson" className="min-w-0">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              {activeLesson ? (
                <>
                  <YouTubePlayer
                    key={activeLesson.id}
                    videoId={activeLesson.youtubeVideoId}
                    lessonId={activeLesson.id}
                    initialWatched={activeProgress?.watchedSeconds ?? 0}
                    isCompleted={activeProgress?.completed ?? false}
                    onComplete={handleLessonComplete}
                    onProgress={handleProgressUpdate}
                  />
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="mb-1 text-xs font-medium text-muted-foreground">
                          Lesson {activeLessonNumber}{activeModule ? ` · ${activeModule.title}` : ""}
                        </p>
                        <h2 className="text-lg font-semibold leading-snug text-foreground sm:text-xl">
                          {activeLesson.title}
                        </h2>
                        {activeLesson.duration != null && activeLesson.duration > 0 && (
                          <span className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock size={14} aria-hidden="true" />
                            {Math.round(activeLesson.duration / 60)} min
                          </span>
                        )}
                      </div>
                      {activeProgress?.completed && (
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-secondary/10 px-2.5 py-1 text-xs font-semibold text-secondary">
                          <CheckCircle2 size={14} aria-hidden="true" />
                          Completed
                        </span>
                      )}
                    </div>

                    {(activeLesson.resources?.pdfUrl || activeLesson.resources?.practiceQuizId) && (
                      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                        {activeLesson.resources.pdfUrl && (
                          <a
                            href={activeLesson.resources.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                          >
                            <FileText size={16} aria-hidden="true" />
                            Lesson notes
                            <ArrowUpRight size={14} aria-hidden="true" className="text-muted-foreground" />
                          </a>
                        )}
                        {activeLesson.resources.practiceQuizId && (
                          <Link
                            to={`/practice/${activeLesson.resources.practiceQuizId}`}
                            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                          >
                            <ListChecks size={16} aria-hidden="true" />
                            Practice quiz
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex aspect-video flex-col items-center justify-center px-6 text-center">
                  <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <BookOpen size={22} aria-hidden="true" />
                  </span>
                  <h2 className="mt-3 font-semibold text-foreground">No lessons available yet</h2>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    This course doesn’t have any lessons to play yet. Check back later.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section aria-label="Course materials" className="min-w-0 lg:sticky lg:top-4">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex border-b border-border p-1.5" aria-label="Course materials">
                {(["lessons", "notes"] as const).map(tab => {
                  const selected = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setActiveTab(tab)}
                      className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        selected
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {tab === "lessons"
                        ? <BookOpen size={16} aria-hidden="true" />
                        : <MessageSquare size={16} aria-hidden="true" />}
                      {tab === "lessons" ? "Course content" : "My notes"}
                    </button>
                  );
                })}
              </div>
              <div
                className="max-h-[70vh] overflow-y-auto p-3 sm:p-4"
              >
                {activeTab === "lessons" ? (
                  course.modules.length > 0 ? (
                    <LessonList
                      modules={course.modules}
                      progressMap={progressMap}
                      activeLessonId={activeLessonId}
                      onSelectLesson={handleSelectLesson}
                    />
                  ) : (
                    <div className="px-4 py-10 text-center">
                      <BookOpen size={22} aria-hidden="true" className="mx-auto text-muted-foreground" />
                      <p className="mt-3 text-sm font-medium text-foreground">Course content is coming soon</p>
                      <p className="mt-1 text-xs text-muted-foreground">There are no modules available yet.</p>
                    </div>
                  )
                ) : (
                  <CourseNotes
                    lessonId={activeLessonId ?? ""}
                    lessonTitle={activeLesson?.title ?? ""}
                    userId={currentUserId}
                  />
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
