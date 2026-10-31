import { Link } from "react-router";
import { BookOpen, CheckCircle2, Play, ChevronRight } from "lucide-react";

interface Props {
  course: {
    id: string;
    title: string;
    slug: string;
    description: string;
    thumbnailUrl?: string;
    level: "olevel" | "alevel";
    subject: string;
  };
  progress?: {
    completed: number;
    total: number;
  };
}

export function CourseCard({ course, progress }: Props) {
  const progressPercent = progress?.total
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  const isCompleted = Boolean(
    progress && progress.total > 0 && progress.completed === progress.total
  );
  const isInProgress = progressPercent > 0 && progressPercent < 100;

  return (
    <Link
      to={`/courses/${course.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-primary/5">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-linear-to-br from-primary/10 via-primary/5 to-secondary/10">
            <span className="flex size-14 items-center justify-center rounded-2xl border border-primary/10 bg-card/80 text-primary shadow-sm">
              <BookOpen size={26} aria-hidden="true" />
            </span>
          </div>
        )}

        <span className="absolute left-3 top-3 rounded-full border border-white/70 bg-card/95 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-sm">
          {course.level === "olevel" ? "O-Level" : "A-Level"}
        </span>
        {isCompleted && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-card/95 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm">
            <CheckCircle2 size={14} aria-hidden="true" />
            Completed
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium text-muted-foreground">{course.subject}</p>
        <h2 className="mt-1 line-clamp-2 min-h-12 text-base font-semibold leading-6 text-foreground">
          {course.title}
        </h2>
        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
          {course.description || "Open this course to explore its lessons and learning materials."}
        </p>

        {progress && progress.total > 0 && (
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{progress.completed} of {progress.total} lessons</span>
              <span className="font-medium text-foreground">{progressPercent}%</span>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label={`${course.title} completion`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPercent}
            >
              <div
                className={`h-full rounded-full transition-all ${isCompleted ? "bg-secondary" : "bg-primary"}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-border pt-4 text-sm font-semibold">
          {isInProgress ? (
            <span className="inline-flex items-center gap-2 text-primary">
              <Play size={15} aria-hidden="true" className="fill-current" />
              Continue learning
            </span>
          ) : isCompleted ? (
            <span className="inline-flex items-center gap-2 text-secondary">
              <CheckCircle2 size={15} aria-hidden="true" />
              Review course
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 text-foreground">
              <Play size={15} aria-hidden="true" />
              Start learning
            </span>
          )}
          <ChevronRight size={17} aria-hidden="true" className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
        </div>
      </div>
    </Link>
  );
}