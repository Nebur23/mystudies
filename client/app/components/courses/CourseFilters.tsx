import { X, Check } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: {
    level?: string | null;
    subject?: string | null;
    filter?: string | null;
  };
  availableFilters: {
    levels: string[];
    subjects: string[];
  };
  onApply: (filters: Record<string, string | null>) => void;
}

export function CourseFilters({ isOpen, onClose, currentFilters, availableFilters, onApply }: Props) {
  const [filters, setFilters] = useState(currentFilters);


  useEffect(() => {
    setFilters(currentFilters)
  }, [currentFilters])

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleApply = () => {
    onApply(filters);
  };

  const handleClear = () => {
    setFilters({ level: null, subject: null, filter: null });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close filters"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-filter-title"
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col animate-in slide-in-from-bottom rounded-t-2xl bg-card duration-300 sm:rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 id="course-filter-title" className="font-semibold text-lg text-foreground">Filter courses</h2>
          <button type="button" onClick={onClose} aria-label="Close filters" className="p-2 hover:bg-muted rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Level Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Exam level</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "olevel", label: "O-Level" },
                { value: "alevel", label: "A-Level" }
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={filters.level === opt.value}
                  onClick={() => setFilters({ ...filters, level: filters.level === opt.value ? null : opt.value })}
                  className={`rounded-xl border p-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${filters.level === opt.value
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-card text-foreground hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {opt.label}
                    {filters.level === opt.value && <Check size={16} />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Subject</label>
            <div className="flex flex-wrap gap-2">
              {availableFilters.subjects.map(subject => (
                <button
                  key={subject}
                  type="button"
                  aria-pressed={filters.subject === subject}
                  onClick={() => setFilters({ ...filters, subject: filters.subject === subject ? null : subject })}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${filters.subject === subject
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-card text-foreground hover:border-primary/50"
                    }`}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">My progress</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "all", label: "All" },
                { value: "enrolled", label: "In Progress" },
                { value: "completed", label: "Completed" }
              ].map(opt => (
                <button
                  key={String(opt.value)}
                  type="button"
                  aria-pressed={filters.filter === opt.value}
                  onClick={() => setFilters({ ...filters, filter: opt.value as string | null })}
                  className={`rounded-lg border p-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${filters.filter === opt.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-card text-foreground hover:border-primary/50"
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-border bg-muted/40 p-4 sm:rounded-b-2xl">
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 rounded-xl border border-border py-3 font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Clear All
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98]"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}