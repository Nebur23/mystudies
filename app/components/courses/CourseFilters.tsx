import { X, Check } from "lucide-react";
import { useState } from "react";

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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      {/* Sheet */}
      <div className="relative bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="font-bold text-lg text-slate-900">Filter Courses</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Level Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Exam Level</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "olevel", label: "O-Level" },
                { value: "alevel", label: "A-Level" }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFilters({...filters, level: filters.level === opt.value ? null : opt.value})}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                    filters.level === opt.value
                      ? "border-purple-600 bg-purple-50 text-purple-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-purple-300"
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
            <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
            <div className="flex flex-wrap gap-2">
              {availableFilters.subjects.map(subject => (
                <button
                  key={subject}
                  onClick={() => setFilters({...filters, subject: filters.subject === subject ? null : subject})}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    filters.subject === subject
                      ? "border-purple-600 bg-purple-50 text-purple-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-purple-300"
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">My Progress</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: null, label: "All" },
                { value: "enrolled", label: "In Progress" },
                { value: "completed", label: "Completed" }
              ].map(opt => (
                <button
                  key={String(opt.value)}
                  onClick={() => setFilters({...filters, filter: opt.value as string | null})}
                  className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                    filters.filter === opt.value
                      ? "border-purple-600 bg-purple-50 text-purple-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-purple-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl sm:rounded-b-2xl flex gap-3">
          <button 
            onClick={handleClear}
            className="flex-1 py-3 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-100"
          >
            Clear All
          </button>
          <button 
            onClick={handleApply}
            className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 active:scale-95 transition-all"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}