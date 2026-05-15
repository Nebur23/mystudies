import { useState, useEffect } from "react";
import { useFetcher } from "react-router";
import { Save, Link as LinkIcon } from "lucide-react";

interface Props {
  lessonId:   string;
  lessonTitle: string;
  userId:     string;
}

// Notes are saved per-lesson in localStorage (no backend needed for v1)
// Phase 2: persist to DB via /api/courses/notes endpoint
function getNoteKey(userId: string, lessonId: string) {
  return `note:${userId}:${lessonId}`;
}

export function CourseNotes({ lessonId, lessonTitle, userId }: Props) {
  const [note, setNote]   = useState("");
  const [saved, setSaved] = useState(false);

  // Load note for this lesson
  useEffect(() => {
    const stored = localStorage.getItem(getNoteKey(userId, lessonId));
    setNote(stored ?? "");
    setSaved(false);
  }, [lessonId, userId]);

  const handleSave = () => {
    localStorage.setItem(getNoteKey(userId, lessonId), note);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Auto-save on pause (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      if (note) localStorage.setItem(getNoteKey(userId, lessonId), note);
    }, 1500);
    return () => clearTimeout(t);
  }, [note, lessonId, userId]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-slate-900 text-sm">
            Notes — <span className="text-slate-500 font-normal">{lessonTitle}</span>
          </h3>
          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              saved
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-600 hover:bg-purple-100 hover:text-purple-700"
            }`}
          >
            <Save size={12} />
            {saved ? "Saved!" : "Save"}
          </button>
        </div>
        <textarea
          value={note}
          onChange={e => { setNote(e.target.value); setSaved(false); }}
          placeholder={`Notes for "${lessonTitle}"...\n\nTip: Include timestamps like [4:20] to mark key moments.`}
          className="w-full h-40 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none font-mono leading-relaxed"
        />
        <p className="text-xs text-slate-400 mt-1 text-right">{note.length} chars · auto-saved</p>
      </div>

      {/* Study tip */}
      <div className="bg-linear-to-br from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200">
        <p className="text-sm font-semibold text-slate-800 mb-1">💬 Discuss with peers</p>
        <p className="text-xs text-slate-600">
          Share what you learned from "{lessonTitle}" in the community feed.
          Other students studying the same topic will see your post.
        </p>
        <a
          href={`/feed?q=${encodeURIComponent(lessonTitle)}`}
          className="inline-flex items-center gap-1 text-xs text-purple-700 font-semibold mt-2 hover:underline"
        >
          <LinkIcon size={11} /> Go to Feed →
        </a>
      </div>
    </div>
  );
}