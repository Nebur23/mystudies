import { useEffect, useState } from "react";
import { X, Check, SlidersHorizontal } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categories: { id: string; name: string; slug: string; icon?: string | null; count: number }[];
  currentFilters: {
    level?:    string | null;
    subject?:  string | null;
    year?:     string | null;
    category?: string | null;
    filter?:   string | null;
  };
  availableFilters: { subjects: string[]; years: number[] };
  onApply: (filters: Record<string, string | null>) => void;
}

export function LibraryFilterSheet({
  isOpen, onClose, categories, currentFilters, availableFilters, onApply,
}: Props) {
  const [local, setLocal] = useState({
    level:    currentFilters.level    ?? null,
    subject:  currentFilters.subject  ?? null,
    year:     currentFilters.year     ?? null,
    category: currentFilters.category ?? null,
  });

  useEffect(() => {
    if (!isOpen) return;
    setLocal({
      level: currentFilters.level ?? null,
      subject: currentFilters.subject ?? null,
      year: currentFilters.year ?? null,
      category: currentFilters.category ?? null,
    });
  }, [
    isOpen,
    currentFilters.level,
    currentFilters.subject,
    currentFilters.year,
    currentFilters.category,
  ]);

  const activeCount = Object.values(local).filter(Boolean).length;

  const set = (key: keyof typeof local, val: string | null) =>
    setLocal(l => ({ ...l, [key]: l[key] === val ? null : val }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="presentation">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/30 backdrop-blur-sm"
        aria-label="Close filters"
        onClick={onClose}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="library-filter-title"
        className="relative flex max-h-[88vh] w-full max-w-lg flex-col rounded-t-3xl border border-border bg-card shadow-2xl"
      >

        {/* Handle */}
        <div className="flex justify-center pt-3">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-muted-foreground" />
            <span id="library-filter-title" className="font-bold text-foreground">Filter Library</span>
            {activeCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {activeCount}
              </span>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label="Close filters" className="rounded-full p-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-7 overflow-y-auto px-5 py-5">

          {/* Level */}
          <section>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Exam Level</p>
            <div className="grid grid-cols-2 gap-2">
              {[{ v: "olevel", l: "O-Level", cls: "border-sky-400 bg-sky-50 text-sky-700" },
                { v: "alevel", l: "A-Level", cls: "border-violet-400 bg-violet-50 text-violet-700" }].map(opt => (
                <button
                  key={opt.v}
                  type="button"
                  aria-pressed={local.level === opt.v}
                  onClick={() => set("level", opt.v)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                    local.level === opt.v ? opt.cls : "border-border text-foreground hover:border-primary/40"
                  }`}
                >
                  {opt.l}
                  {local.level === opt.v && <Check size={14} />}
                </button>
              ))}
            </div>
          </section>

          {/* Resource type */}
          <section>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Resource Type</p>
            <div className="grid grid-cols-2 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  aria-pressed={local.category === cat.slug}
                  onClick={() => set("category", cat.slug)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-all text-left ${
                    local.category === cat.slug
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-foreground hover:border-primary/40"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span className="text-xs font-semibold">{cat.name}</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground">{cat.count}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Subject */}
          <section>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Subject</p>
            <div className="flex flex-wrap gap-2">
              {availableFilters.subjects.map(s => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={local.subject === s}
                  onClick={() => set("subject", s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    local.subject === s
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          {/* Year */}
          <section>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Year</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={!local.year}
                onClick={() => setLocal(l => ({ ...l, year: null }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  !local.year ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                }`}
              >
                Any year
              </button>
              {availableFilters.years.map(y => (
                <button
                  key={y}
                  type="button"
                  aria-pressed={local.year === String(y)}
                  onClick={() => set("year", String(y))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all font-mono ${
                    local.year === String(y)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-border bg-card px-5 py-4">
          <button
            type="button"
            onClick={() => setLocal({ level: null, subject: null, year: null, category: null })}
            className="min-h-11 flex-1 rounded-xl border border-border py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={() => onApply({ level: local.level, subject: local.subject, year: local.year, category: local.category })}
            className="min-h-11 flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Apply{activeCount > 0 ? ` (${activeCount})` : ""}
          </button>
        </div>
      </section>
    </div>
  );
}