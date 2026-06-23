import { WifiOff, BookOpen, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-stone-50">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-20 h-20 bg-stone-100 rounded-3xl flex items-center justify-center mx-auto">
          <WifiOff size={36} className="text-stone-400" />
        </div>
        <h1 className="text-2xl font-bold text-stone-900">You're offline</h1>
        <p className="text-stone-500 text-sm leading-relaxed">
          No internet connection. Pages you've visited recently are still
          available — tap below to go back.
        </p>
        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-2xl font-semibold text-sm"
          >
            <BookOpen size={16} /> View cached pages
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 px-6 py-3 border border-stone-200 text-stone-700 rounded-2xl font-semibold text-sm"
          >
            <RefreshCw size={16} /> Try again
          </button>
        </div>
      </div>
    </div>
  );
}