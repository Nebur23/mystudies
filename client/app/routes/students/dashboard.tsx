import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  BookOpenCheck,
  Check,
  ChevronRight,
  CirclePlay,
  GraduationCap,
  Target,
  Trophy,
} from "lucide-react";
import { Link, useLoaderData } from "react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "~/components/ui/chart";
import { db } from "~/db";
import { course, courseLesson, courseModule, quizScore, studentProfile, userLessonProgress } from "~/db/schema";
import type { Route } from "./+types/dashboard";
import { requireAuth } from "~/lib/auth.server";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request);
  const userId = session.user.id;
  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - 6);

  const [profile, courses, lessons, progress, quizStats, recentQuizzes] = await Promise.all([
    db.query.studentProfile.findFirst({
      where: eq(studentProfile.userId, userId),
      columns: {
        displayName: true,
        level: true,
        subjects: true,
        targetExamYear: true,
      },
    }),
    db.query.course.findMany({
      where: eq(course.isPublished, true),
      columns: {
        id: true,
        title: true,
        slug: true,
        subject: true,
        level: true,
      },
      orderBy: asc(course.title),
    }),
    db
      .select({
        id: courseLesson.id,
        title: courseLesson.title,
        courseId: course.id,
      })
      .from(courseLesson)
      .innerJoin(courseModule, eq(courseLesson.moduleId, courseModule.id))
      .innerJoin(course, eq(courseModule.courseId, course.id))
      .where(eq(course.isPublished, true)),
    db
      .select({
        lessonId: userLessonProgress.lessonId,
        completed: userLessonProgress.completed,
        lastWatchedAt: userLessonProgress.lastWatchedAt,
        courseId: course.id,
      })
      .from(userLessonProgress)
      .innerJoin(courseLesson, eq(userLessonProgress.lessonId, courseLesson.id))
      .innerJoin(courseModule, eq(courseLesson.moduleId, courseModule.id))
      .innerJoin(course, eq(courseModule.courseId, course.id))
      .where(and(
        eq(userLessonProgress.userId, userId),
        eq(course.isPublished, true),
      )),
    db
      .select({
        total: count(),
        average: sql<number>`coalesce(avg(${quizScore.percentage}::numeric), 0)::float`,
      })
      .from(quizScore)
      .where(eq(quizScore.userId, userId)),
    db.query.quizScore.findMany({
      where: eq(quizScore.userId, userId),
      columns: {
        quizId: true,
        score: true,
        totalQuestions: true,
        percentage: true,
        completedAt: true,
      },
      orderBy: desc(quizScore.completedAt),
      limit: 8,
    }),
  ]);

  const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const progressByCourse = new Map<string, { completed: number; total: number; latestAt: Date | null }>();
  for (const courseItem of courses) {
    progressByCourse.set(courseItem.id, { completed: 0, total: 0, latestAt: null });
  }
  for (const lesson of lessons) {
    const courseProgress = progressByCourse.get(lesson.courseId);
    if (courseProgress) courseProgress.total += 1;
  }
  for (const item of progress) {
    const courseProgress = progressByCourse.get(item.courseId);
    if (!courseProgress) continue;
    if (item.completed) courseProgress.completed += 1;
    if (item.lastWatchedAt && (!courseProgress.latestAt || item.lastWatchedAt > courseProgress.latestAt)) {
      courseProgress.latestAt = item.lastWatchedAt;
    }
  }

  const latestProgressByCourse = new Map<string, (typeof progress)[number]>();
  for (const item of progress) {
    const existing = latestProgressByCourse.get(item.courseId);
    if (item.lastWatchedAt && (!existing?.lastWatchedAt || item.lastWatchedAt > existing.lastWatchedAt)) {
      latestProgressByCourse.set(item.courseId, item);
    }
  }

  const profileSubjects = profile?.subjects ?? [];
  const preferredCourse = courses.find((courseItem) =>
    courseItem.level === profile?.level && profileSubjects.includes(courseItem.subject),
  );
  const activeCourses = courses
    .filter((courseItem) => {
      const courseProgress = progressByCourse.get(courseItem.id);
      return courseProgress?.latestAt && courseProgress.total > courseProgress.completed;
    })
    .sort((a, b) => {
      const aTime = progressByCourse.get(a.id)?.latestAt?.getTime() ?? 0;
      const bTime = progressByCourse.get(b.id)?.latestAt?.getTime() ?? 0;
      return bTime - aTime;
    });
  const courseToContinue = activeCourses[0]
    ?? (preferredCourse && (progressByCourse.get(preferredCourse.id)?.completed ?? 0) < (progressByCourse.get(preferredCourse.id)?.total ?? 0)
      ? preferredCourse
      : undefined)
    ?? courses.find((courseItem) => {
      const courseProgress = progressByCourse.get(courseItem.id);
      return courseProgress && courseProgress.completed < courseProgress.total;
    })
    ?? courses[0]
    ?? null;

  const currentProgress = courseToContinue
    ? progressByCourse.get(courseToContinue.id)
    : undefined;
  const latestLesson = courseToContinue
    ? latestProgressByCourse.get(courseToContinue.id)
    : undefined;
  const latestLessonTitle = latestLesson ? lessonById.get(latestLesson.lessonId)?.title : null;

  const completedLessons = progress.filter((item) => item.completed).length;
  const weekActivity = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const lessonCount = progress.filter((item) => {
      if (!item.lastWatchedAt || item.lastWatchedAt < weekStart) return false;
      const watchedAt = item.lastWatchedAt;
      return `${watchedAt.getFullYear()}-${watchedAt.getMonth()}-${watchedAt.getDate()}` === key;
    }).length;
    return {
      label: new Intl.DateTimeFormat("en", { weekday: "short" }).format(date),
      lessonCount,
    };
  });
  const activeDays = weekActivity.filter((day) => day.lessonCount > 0).length;
  const quizTrend = recentQuizzes
    .slice()
    .reverse()
    .map((quiz) => ({
      date: new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(quiz.completedAt),
      score: Number(quiz.percentage),
      quizName: formatQuizName(quiz.quizId),
    }));

  return {
    student: {
      name: profile?.displayName || session.user.name || "Student",
      level: profile?.level ?? null,
      subjects: profileSubjects,
      targetExamYear: profile?.targetExamYear ?? null,
    },
    stats: {
      completedLessons,
      totalLessons: lessons.length,
      lessonCompletion: lessons.length ? Math.round((completedLessons / lessons.length) * 100) : 0,
      quizzesCompleted: Number(quizStats[0]?.total ?? 0),
      averageQuizScore: Number(quizStats[0]?.average ?? 0),
      activeDays,
    },
    courseToContinue: courseToContinue
      ? {
          ...courseToContinue,
          completed: currentProgress?.completed ?? 0,
          total: currentProgress?.total ?? 0,
          latestLessonTitle,
        }
      : null,
    weekActivity,
    quizTrend,
    recentQuizzes: recentQuizzes.slice(0, 5),
  };
}

const formatQuizName = (quizId: string) =>
  quizId
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const activityChartConfig = {
  lessonCount: {
    label: "Lessons opened",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

const quizChartConfig = {
  score: {
    label: "Quiz score",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export default function StudentDashboard() {
  const { student, stats, courseToContinue, weekActivity, quizTrend, recentQuizzes } =
    useLoaderData<typeof loader>();
  const firstName = student.name.trim().split(/\s+/)[0] || "Student";
  const progressPercent = courseToContinue?.total
    ? Math.round((courseToContinue.completed / courseToContinue.total) * 100)
    : 0;

  return (
    <main className="min-h-full flex-1 bg-muted/30">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Your learning overview</p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Welcome back, {firstName}
            </h1>
            <p className="text-sm text-muted-foreground">
              Keep building momentum. Here’s your progress at a glance.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/practice">
                <Target />
                Practice
              </Link>
            </Button>
            <Button asChild>
              <Link to="/courses">
                Explore courses
                <ArrowUpRight />
              </Link>
            </Button>
          </div>
        </header>

        <section aria-label="Learning summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<BookOpenCheck />}
            label="Lessons completed"
            value={stats.completedLessons.toLocaleString()}
            detail={`of ${stats.totalLessons.toLocaleString()} available`}
          />
          <StatCard
            icon={<BookOpen />}
            label="Lesson completion"
            value={`${stats.lessonCompletion}%`}
            detail={`${stats.completedLessons} of ${stats.totalLessons} lessons`}
          />
          <StatCard
            icon={<Trophy />}
            label="Average quiz score"
            value={stats.quizzesCompleted ? `${Math.round(stats.averageQuizScore)}%` : "—"}
            detail={stats.quizzesCompleted
              ? `Across ${stats.quizzesCompleted} ${stats.quizzesCompleted === 1 ? "quiz" : "quizzes"}`
              : "Complete a quiz to see your average"}
          />
          <StatCard
            icon={<Activity />}
            label="Active days"
            value={`${stats.activeDays}/7`}
            detail="Days with lesson activity this week"
          />
        </section>

        {courseToContinue ? (
          <Card className="gap-0 rounded-xl border-l-4 border-l-primary py-0 shadow-none">
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex min-w-0 items-start gap-4">
                <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CirclePlay className="size-5" />
                </div>
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">Continue learning</Badge>
                    <Badge variant="outline">{courseToContinue.subject}</Badge>
                    <Badge variant="outline">
                      {courseToContinue.level === "olevel" ? "O-Level" : "A-Level"}
                    </Badge>
                  </div>
                  <div>
                    <h2 className="truncate text-lg font-semibold tracking-tight">
                      {courseToContinue.title}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {courseToContinue.latestLessonTitle
                        ? `Last opened: ${courseToContinue.latestLessonTitle}`
                        : "Start with the first lesson and build your understanding."}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-64 sm:shrink-0">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Course progress</span>
                  <span className="font-semibold tabular-nums">{progressPercent}%</span>
                </div>
                <div
                  role="progressbar"
                  aria-label={`${courseToContinue.title} progress`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progressPercent}
                  className="h-2 overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">
                    {courseToContinue.completed} of {courseToContinue.total} lessons
                  </span>
                  <Button asChild size="sm">
                    <Link to={`/courses/${courseToContinue.slug}`}>
                      {progressPercent > 0 ? "Continue" : "Start course"}
                      <ChevronRight />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="rounded-xl shadow-none">
            <CardContent className="flex flex-col items-start justify-between gap-4 pt-6 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-semibold">Find your next course</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Explore the course library and choose a subject to get started.
                </p>
              </div>
              <Button asChild>
                <Link to="/courses">Browse courses <ChevronRight /></Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <section aria-label="Study charts" className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-xl shadow-none">
            <CardHeader>
              <CardTitle>Study activity</CardTitle>
              <CardDescription>Lessons last opened over the past seven days</CardDescription>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <ChartContainer config={activityChartConfig} className="aspect-auto h-[230px] w-full">
                <BarChart accessibilityLayer data={weekActivity} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={32}
                  />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <Bar
                    dataKey="lessonCount"
                    fill="var(--color-lessonCount)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
              <p className="mt-2 px-4 text-xs text-muted-foreground">
                Each lesson counts once on the day it was last opened.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-none">
            <CardHeader>
              <CardTitle>Quiz performance</CardTitle>
              <CardDescription>Your latest quiz scores, from oldest to newest</CardDescription>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              {quizTrend.length ? (
                <ChartContainer config={quizChartConfig} className="aspect-auto h-[230px] w-full">
                  <LineChart accessibilityLayer data={quizTrend} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={20}
                    />
                    <YAxis
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                      tickFormatter={(value: number) => `${value}%`}
                      tickLine={false}
                      axisLine={false}
                      width={38}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          indicator="line"
                          formatter={(value) => [`${value}%`, "Score"]}
                          labelFormatter={(value, payload) =>
                            payload[0]?.payload.quizName
                              ? `${payload[0].payload.quizName} · ${value}`
                              : value
                          }
                        />
                      }
                    />
                    <Line
                      dataKey="score"
                      type="monotone"
                      stroke="var(--color-score)"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "var(--color-score)", strokeWidth: 2, stroke: "var(--background)" }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ChartContainer>
              ) : (
                <div className="flex h-[230px] flex-col items-center justify-center gap-2 text-center">
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                    <Target className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">No quiz scores yet</p>
                  <p className="max-w-xs text-xs text-muted-foreground">
                    Complete a practice quiz and your performance trend will appear here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
          <Card className="rounded-xl shadow-none">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div className="space-y-1.5">
                <CardTitle>Recent quiz results</CardTitle>
                <CardDescription>A quick look at your latest practice</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/practice">Practice <ChevronRight /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentQuizzes.length ? (
                <div className="divide-y">
                  {recentQuizzes.map((quiz, index) => {
                    const percentage = Number(quiz.percentage);
                    return (
                      <div
                        key={`${quiz.quizId}-${quiz.completedAt.toISOString()}-${index}`}
                        className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <Check className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{formatQuizName(quiz.quizId)}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {quiz.score} of {quiz.totalQuestions} correct
                            <span className="mx-1.5">·</span>
                            {new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(quiz.completedAt)}
                          </p>
                        </div>
                        <Badge variant={percentage >= 70 ? "secondary" : "outline"} className="tabular-nums">
                          {Math.round(percentage)}%
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <p className="text-sm font-medium">No results to show yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Your completed practice quizzes will appear here.
                  </p>
                  <Button asChild variant="link" size="sm" className="mt-2">
                    <Link to="/practice">Start practicing <ArrowUpRight /></Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="size-5 text-muted-foreground" />
                Study focus
              </CardTitle>
              <CardDescription>Your selected level and subjects</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {student.level && (
                  <Badge variant="secondary">
                    {student.level === "olevel" ? "O-Level" : "A-Level"}
                  </Badge>
                )}
                {student.targetExamYear && (
                  <Badge variant="outline">Target exam · {student.targetExamYear}</Badge>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Focus subjects</p>
                {student.subjects.length ? (
                  <div className="flex flex-wrap gap-2">
                    {student.subjects.map((subject) => (
                      <Badge key={subject} variant="outline">{subject}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Choose subjects to personalize your study space.</p>
                )}
              </div>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link to="/profile/settings">Update study profile <ChevronRight /></Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="gap-0 rounded-xl shadow-none">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription>{label}</CardDescription>
        <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}
