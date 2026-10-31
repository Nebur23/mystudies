import { useState, useEffect } from "react";
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
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground">
            My notes
            <span className="mt-1 block line-clamp-2 text-xs font-normal text-muted-foreground">
              {lessonTitle || "Select a lesson to start taking notes"}
            </span>
          </h3>
          <button
            type="button"
            onClick={handleSave}
            className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              saved
                ? "bg-secondary/10 text-secondary"
                : "bg-primary/5 text-primary hover:bg-primary/10"
            }`}
          >
            <Save size={14} aria-hidden="true" />
            {saved ? "Saved!" : "Save"}
          </button>
        </div>
        <textarea
          aria-label={`Notes for ${lessonTitle || "this course"}`}
          value={note}
          onChange={e => { setNote(e.target.value); setSaved(false); }}
          placeholder={`Notes for "${lessonTitle || "this lesson"}"...\n\nTip: Include timestamps like [4:20] to mark key moments.`}
          className="h-48 w-full resize-y rounded-lg border border-border bg-background p-3 text-sm leading-relaxed text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
        <p className="mt-2 text-right text-xs text-muted-foreground">{note.length} characters · auto-saved</p>
      </div>

      <div className="rounded-xl border border-border bg-muted/40 p-4">
        <p className="mb-1 text-sm font-semibold text-foreground">Discuss with peers</p>
        <p className="text-xs leading-5 text-muted-foreground">
          Share what you learned from “{lessonTitle || "this course"}” in the community feed.
          Other students studying the same topic will see your post.
        </p>
        <a
          href={`/feed?q=${encodeURIComponent(lessonTitle)}`}
          className="mt-3 inline-flex min-h-8 items-center gap-1.5 rounded-md text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <LinkIcon size={13} aria-hidden="true" /> Go to feed
        </a>
      </div>
    </div>
  );
}