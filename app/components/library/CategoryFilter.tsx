import { useState } from "react";
import { X, Check } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categories: { id: string; name: string; slug: string; icon?: string }[];
  currentFilters: {
    level?: string | null;
    subject?: string | null;
    year?: string | null;
    category?: string | null;
  };
  availableFilters: {
    subjects: string[];
    years: number[];
    levels: readonly ["olevel", "alevel"];
  };
  onApply: (filters: Record<string, string | null>) => void;
}

export function CategoryFilter({ 
  isOpen, 
  onClose, 
  categories, 
  currentFilters, 
  availableFilters, 
  onApply 
}: Props) {
  const [filters, setFilters] = useState(currentFilters);

  const handleApply = () => onApply(filters);
  const handleClear = () => setFilters({ level: null, subject: null, year: null, category: null });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="font-bold text-lg text-slate-900">Filter Resources</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Level */}
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

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Resource Type</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFilters({...filters, category: filters.category === cat.id ? null : cat.id})}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border flex items-center gap-1.5 ${
                    filters.category === cat.id
                      ? "border-purple-600 bg-purple-50 text-purple-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-purple-300"
                  }`}
                >
                  {cat.icon && <span>{cat.icon}</span>} {cat.name}
                  {filters.category === cat.id && <Check size={14} className="ml-1" />}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
              {availableFilters.subjects.map(subject => (
                <button
                  key={subject}
                  onClick={() => setFilters({...filters, subject: filters.subject === subject ? null : subject})}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border text-left ${
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

          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Year</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilters({...filters, year: null})}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  !filters.year ? "border-purple-600 bg-purple-50 text-purple-700" : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                All Years
              </button>
              {availableFilters.years.slice(0, 8).map(year => (
                <button
                  key={year}
                  onClick={() => setFilters({...filters, year: filters.year === String(year) ? null : String(year)})}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    filters.year === String(year)
                      ? "border-purple-600 bg-purple-50 text-purple-700"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex gap-3">
          <button onClick={handleClear} className="flex-1 py-3 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-100">
            Clear All
          </button>
          <button onClick={handleApply} className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 active:scale-95 transition-all">
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}