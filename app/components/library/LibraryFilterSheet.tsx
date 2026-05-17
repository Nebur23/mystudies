import { useState } from "react";
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

  const activeCount = Object.values(local).filter(Boolean).length;

  const set = (key: keyof typeof local, val: string | null) =>
    setLocal(l => ({ ...l, [key]: l[key] === val ? null : val }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-lg rounded-t-3xl max-h-[88vh] flex flex-col shadow-2xl">

        {/* Handle */}
        <div className="flex justify-center pt-3">
          <div className="w-10 h-1 bg-stone-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={15} className="text-stone-500" />
            <span className="font-bold text-stone-900">Filter Library</span>
            {activeCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-stone-100 rounded-full transition-colors">
            <X size={16} className="text-stone-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7">

          {/* Level */}
          <section>
            <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-3">Exam Level</p>
            <div className="grid grid-cols-2 gap-2">
              {[{ v: "olevel", l: "O-Level", cls: "border-sky-400 bg-sky-50 text-sky-700" },
                { v: "alevel", l: "A-Level", cls: "border-violet-400 bg-violet-50 text-violet-700" }].map(opt => (
                <button
                  key={opt.v}
                  onClick={() => set("level", opt.v)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                    local.level === opt.v ? opt.cls : "border-stone-200 text-stone-700 hover:border-stone-300"
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
            <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-3">Resource Type</p>
            <div className="grid grid-cols-2 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => set("category", cat.slug)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-all text-left ${
                    local.category === cat.slug
                      ? "border-amber-400 bg-amber-50 text-amber-800"
                      : "border-stone-200 text-stone-700 hover:border-stone-300"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span className="text-xs font-semibold">{cat.name}</span>
                  </span>
                  <span className="text-[10px] text-stone-400">{cat.count}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Subject */}
          <section>
            <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-3">Subject</p>
            <div className="flex flex-wrap gap-2">
              {availableFilters.subjects.map(s => (
                <button
                  key={s}
                  onClick={() => set("subject", s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    local.subject === s
                      ? "border-amber-400 bg-amber-50 text-amber-800"
                      : "border-stone-200 text-stone-600 hover:border-stone-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          {/* Year */}
          <section>
            <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-3">Year</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setLocal(l => ({ ...l, year: null }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  !local.year ? "border-amber-400 bg-amber-50 text-amber-800" : "border-stone-200 text-stone-600"
                }`}
              >
                Any year
              </button>
              {availableFilters.years.map(y => (
                <button
                  key={y}
                  onClick={() => set("year", String(y))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all font-mono ${
                    local.year === String(y)
                      ? "border-amber-400 bg-amber-50 text-amber-800"
                      : "border-stone-200 text-stone-600 hover:border-stone-300"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-stone-100 flex gap-3">
          <button
            onClick={() => setLocal({ level: null, subject: null, year: null, category: null })}
            className="flex-1 py-3 rounded-xl border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
          >
            Clear all
          </button>
          <button
            onClick={() => onApply({ level: local.level, subject: local.subject, year: local.year, category: local.category })}
            className="flex-1 py-3 rounded-xl bg-stone-800 text-white text-sm font-bold hover:bg-stone-900 active:scale-[0.97] transition-all"
          >
            Apply{activeCount > 0 ? ` (${activeCount})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}