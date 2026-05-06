import { useState } from "react";
import { X, Check } from "lucide-react";

const CAMEROON_REGIONS = [
  "northwest", "southwest", "littoral", "centre", "west", 
  "adamawa", "north", "east", "south"
];

const GCE_SUBJECTS = [
  "Mathematics", "English", "French", "Biology", "Physics", 
  "Chemistry", "Geography", "History", "Economics", "Computer Science"
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: { level?: string; region?: string; subject?: string };
  onApply: (filters: { level?: string; region?: string; subject?: string }) => void;
}

export function FilterSheet({ isOpen, onClose, currentFilters, onApply }: Props) {
  const [filters, setFilters] = useState(currentFilters);

  const handleApply = () => {
    onApply(filters);
  };

  const handleClear = () => {
    setFilters({});
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
          <h2 className="font-bold text-lg text-slate-900">Filters</h2>
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
                  value={filters.level}
                  onClick={() => setFilters({...filters, level: filters.level === opt.value ? undefined : opt.value})}
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

          {/* Region */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Region</label>
            <div className="grid grid-cols-3 gap-2">
              {CAMEROON_REGIONS.map(region => (
                <button
                  key={region}
                  onClick={() => setFilters({...filters, region: filters.region === region ? undefined : region})}
                  className={`p-2 rounded-lg border text-xs font-medium capitalize transition-all ${
                    filters.region === region
                      ? "border-purple-600 bg-purple-50 text-purple-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-purple-300"
                  }`}
                >
                  {region.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
            <div className="grid grid-cols-2 gap-2">
              {GCE_SUBJECTS.map(subject => (
                <button
                  key={subject}
                  onClick={() => setFilters({...filters, subject: filters.subject === subject ? undefined : subject})}
                  className={`p-2.5 rounded-lg border text-xs font-medium transition-all flex items-center justify-between ${
                    filters.subject === subject
                      ? "border-purple-600 bg-purple-50 text-purple-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-purple-300"
                  }`}
                >
                  {subject}
                  {filters.subject === subject && <Check size={14} />}
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
            Clear
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