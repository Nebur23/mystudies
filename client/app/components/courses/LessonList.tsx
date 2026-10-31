import { useState } from "react";
import { Play, CheckCircle2, ChevronDown, ChevronUp, Clock } from "lucide-react";

interface Lesson {
  id:       string;
  title:    string;
  duration: number | null;
  order:    number;
}

interface Module {
  id:      string;
  title:   string;
  order:   number;
  lessons: Lesson[];
}

interface ProgressEntry {
  completed:      boolean;
  watchedSeconds: number;
}

interface Props {
  modules:        Module[];
  progressMap:    Record<string, ProgressEntry>;
  activeLessonId: string | null;
  onSelectLesson: (id: string) => void;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function LessonList({ modules, progressMap, activeLessonId, onSelectLesson }: Props) {
  // ✅ Auto-open the module containing the active lesson
  const initialOpenModule = modules.find(m =>
    m.lessons.some(l => l.id === activeLessonId)
  )?.id ?? modules[0]?.id ?? null;

  const [openModuleIds, setOpenModuleIds] = useState<Set<string>>(
    new Set(initialOpenModule ? [initialOpenModule] : [])
  );

  const toggleModule = (id: string) => {
    setOpenModuleIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Total duration per module
  const moduleDuration = (mod: Module) =>
    mod.lessons.reduce((acc, l) => acc + (l.duration ?? 0), 0);

  return (
    <div className="space-y-3">
      {modules.map(mod => {
        const isOpen        = openModuleIds.has(mod.id);
        const completedCount = mod.lessons.filter(l => progressMap[l.id]?.completed).length;
        const totalCount    = mod.lessons.length;
        const allDone       = completedCount === totalCount && totalCount > 0;

        return (
          <div key={mod.id} className="overflow-hidden rounded-xl border border-border bg-card">
            <button
              type="button"
              onClick={() => toggleModule(mod.id)}
              aria-expanded={isOpen}
              aria-controls={`module-lessons-${mod.id}`}
              className="flex min-h-16 w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
            >
              <div className="flex items-center gap-3">
                <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  allDone ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"
                }`}>
                  {allDone ? <CheckCircle2 size={15} aria-hidden="true" /> : mod.order}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{mod.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {completedCount} of {totalCount} lessons
                    {moduleDuration(mod) > 0 && (
                      <> · {formatDuration(moduleDuration(mod))}</>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <div className="relative size-6 shrink-0" aria-hidden="true">
                  <svg viewBox="0 0 24 24" className="size-full -rotate-90">
                    <circle cx="12" cy="12" r="9" fill="none" className="stroke-muted" strokeWidth="2.5" />
                    <circle
                      cx="12" cy="12" r="9" fill="none"
                      className={allDone ? "stroke-secondary" : "stroke-primary"}
                      strokeWidth="2.5"
                      strokeDasharray={`${2 * Math.PI * 9}`}
                      strokeDashoffset={`${2 * Math.PI * 9 * (1 - completedCount / Math.max(totalCount, 1))}`}
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                {isOpen
                  ? <ChevronUp size={16} aria-hidden="true" className="text-muted-foreground" />
                  : <ChevronDown size={16} aria-hidden="true" className="text-muted-foreground" />
                }
              </div>
            </button>

            <div
              id={`module-lessons-${mod.id}`}
              hidden={!isOpen}
              className="divide-y divide-border border-t border-border"
            >
                {mod.lessons.map(lesson => {
                  const progress    = progressMap[lesson.id];
                  const isActive    = lesson.id === activeLessonId;
                  const isCompleted = progress?.completed ?? false;
                  const watchedPct  = progress && !isCompleted && lesson.duration
                    ? Math.min(100, Math.round((progress.watchedSeconds / lesson.duration) * 100))
                    : 0;

                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => onSelectLesson(lesson.id)}
                      aria-current={isActive ? "step" : undefined}
                      className={`flex min-h-16 w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
                        isActive
                          ? "border-l-primary bg-primary/5"
                          : "border-l-transparent hover:bg-muted/50"
                      }`}
                    >
                      <div className={`flex size-7 shrink-0 items-center justify-center rounded-full transition-colors ${
                        isCompleted ? "bg-secondary/10 text-secondary"
                        : isActive  ? "bg-primary text-primary-foreground"
                        :             "bg-muted text-muted-foreground"
                      }`}>
                        {isCompleted
                          ? <CheckCircle2 size={14} aria-hidden="true" />
                          : <Play size={12} aria-hidden="true" fill={isActive ? "currentColor" : "none"} />
                        }
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${
                          isActive ? "font-semibold text-primary" : "text-foreground"
                        }`}>
                          {lesson.title}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          {lesson.duration && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock size={11} aria-hidden="true" /> {formatDuration(lesson.duration)}
                            </span>
                          )}
                          {watchedPct > 0 && (
                            <div
                              className="h-1 max-w-20 flex-1 overflow-hidden rounded-full bg-muted"
                              role="progressbar"
                              aria-label={`${lesson.title} watched`}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-valuenow={watchedPct}
                            >
                              <div
                                className="h-full rounded-full bg-primary/60"
                                style={{ width: `${watchedPct}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        );
      })}
    </div>
  );
}