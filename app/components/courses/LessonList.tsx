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
    <div className="space-y-2">
      {modules.map(mod => {
        const isOpen        = openModuleIds.has(mod.id);
        const completedCount = mod.lessons.filter(l => progressMap[l.id]?.completed).length;
        const totalCount    = mod.lessons.length;
        const allDone       = completedCount === totalCount && totalCount > 0;

        return (
          <div key={mod.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Module header */}
            <button
              onClick={() => toggleModule(mod.id)}
              className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  allDone ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"
                }`}>
                  {allDone ? <CheckCircle2 size={14} /> : mod.order}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{mod.title}</p>
                  <p className="text-xs text-slate-500">
                    {completedCount}/{totalCount} completed
                    {moduleDuration(mod) > 0 && (
                      <> · {formatDuration(moduleDuration(mod))}</>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Mini progress ring */}
                <div className="relative w-6 h-6 shrink-0">
                  <svg viewBox="0 0 24 24" className="w-full h-full -rotate-90">
                    <circle cx="12" cy="12" r="9" fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
                    <circle
                      cx="12" cy="12" r="9" fill="none"
                      stroke={allDone ? "#22c55e" : "#9333ea"}
                      strokeWidth="2.5"
                      strokeDasharray={`${2 * Math.PI * 9}`}
                      strokeDashoffset={`${2 * Math.PI * 9 * (1 - completedCount / Math.max(totalCount, 1))}`}
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                {isOpen
                  ? <ChevronUp  size={16} className="text-slate-400" />
                  : <ChevronDown size={16} className="text-slate-400" />
                }
              </div>
            </button>

            {/* Lessons */}
            {isOpen && (
              <div className="border-t border-slate-100 divide-y divide-slate-50">
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
                      onClick={() => onSelectLesson(lesson.id)}
                      className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                        isActive
                          ? "bg-purple-50 border-l-4 border-l-purple-600"
                          : "hover:bg-slate-50 border-l-4 border-l-transparent"
                      }`}
                    >
                      {/* Status icon */}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isCompleted ? "bg-green-100 text-green-600"
                        : isActive  ? "bg-purple-600 text-white"
                        :             "bg-slate-100 text-slate-400"
                      }`}>
                        {isCompleted
                          ? <CheckCircle2 size={13} />
                          : <Play size={11} fill={isActive ? "currentColor" : "none"} />
                        }
                      </div>

                      {/* Text + progress */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${
                          isActive ? "font-semibold text-purple-900" : "text-slate-700"
                        }`}>
                          {lesson.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {lesson.duration && (
                            <span className="text-xs text-slate-400 flex items-center gap-0.5">
                              <Clock size={10} /> {formatDuration(lesson.duration)}
                            </span>
                          )}
                          {/* Partial progress bar */}
                          {watchedPct > 0 && (
                            <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden max-w-16">
                              <div
                                className="h-full bg-purple-400 rounded-full"
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
            )}
          </div>
        );
      })}
    </div>
  );
}