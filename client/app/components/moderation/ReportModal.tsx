import { useState, useEffect } from "react";
import { useFetcher } from "react-router";
import {
  X, Flag, AlertTriangle, MessageSquare, UserX,
  FileWarning, Copyright, HelpCircle, Check,
} from "lucide-react";

interface Props {
  isOpen:     boolean;
  onClose:    () => void;
  targetType: "profile" | "activity" | "comment" | "message";
  targetId:   string;
}

const REASONS = [
  { value: "spam",            label: "Spam or misleading",      icon: AlertTriangle },
  { value: "harassment",      label: "Harassment or bullying",   icon: MessageSquare },
  { value: "inappropriate",   label: "Inappropriate content",    icon: Flag },
  { value: "fake_profile",    label: "Fake or impersonation",    icon: UserX },
  { value: "cheating",        label: "Academic dishonesty",      icon: FileWarning },
  { value: "copyright",       label: "Copyright violation",      icon: Copyright },
  { value: "other",           label: "Other",                    icon: HelpCircle },
] as const;

export function ReportModal({ isOpen, onClose, targetType, targetId }: Props) {
  const [step,           setStep]           = useState<1 | 2>(1);
  const [selectedReason, setSelectedReason] = useState("");
  const [details,        setDetails]        = useState("");

  const fetcher = useFetcher<{ success?: boolean; error?: string }>();

  // ✅ useEffect — not inline in render
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      const t = setTimeout(() => {
        onClose();
        setStep(1);
        setSelectedReason("");
        setDetails("");
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [fetcher.state, fetcher.data]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) return;
    fetcher.submit(
      { targetType, targetId, reason: selectedReason, details },
      { method: "POST", action: "/api/report" }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="p-1 hover:bg-slate-100 rounded-full mr-1"
                aria-label="Back"
              >
                <X size={16} className="-rotate-45 text-slate-500" />
              </button>
            )}
            <h2 className="font-bold text-lg text-slate-900">
              Report {targetType}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
          {fetcher.data?.success ? (
            // Success state
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-green-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Report Submitted</h3>
              <p className="text-sm text-slate-500">Our moderation team will review this shortly.</p>
            </div>
          ) : fetcher.data?.error ? (
            // Error state
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <p className="text-sm text-red-700">{fetcher.data.error}</p>
            </div>
          ) : step === 1 ? (
            // Step 1: reason selection
            <div className="space-y-2">
              <p className="text-sm text-slate-500 mb-4">Why are you reporting this {targetType}?</p>
              {REASONS.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => { setSelectedReason(r.value); setStep(2); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-all text-left"
                >
                  <r.icon size={18} className="text-slate-500 shrink-0" />
                  <span className="text-sm font-medium text-slate-900">{r.label}</span>
                </button>
              ))}
            </div>
          ) : (
            // Step 2: details + submit
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                <span className="text-xs font-medium text-slate-500">Reason:</span>
                <span className="text-sm font-semibold text-slate-800">
                  {REASONS.find(r => r.value === selectedReason)?.label}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Additional details <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                  placeholder="Please provide more context..."
                />
                <p className="text-xs text-slate-400 text-right mt-1">{details.length}/500</p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={fetcher.state === "submitting"}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {fetcher.state === "submitting" ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}