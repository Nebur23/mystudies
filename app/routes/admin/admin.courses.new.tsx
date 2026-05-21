import { useState, useEffect, useRef } from "react";
import { useNavigate, useFetcher } from "react-router";
import {
  Plus, Trash2, GripVertical,
  ChevronDown, ChevronUp, CheckCircle2,
  AlertCircle, Loader2, BookOpen, ArrowLeft,
  Upload,
} from "lucide-react";
import { db } from "~/db";
import { course, courseModule, courseLesson } from "~/db/schema/courses";
import { requireAuth } from "~/lib/auth";
import { HugeiconsIcon } from "@hugeicons/react";
import { YoutubeIcon } from "@hugeicons/core-free-icons";
import { useCompressedUpload } from "~/utils/uploadthing";
import { toast } from "sonner";
import type { Route } from "./+types/admin.courses.new";

// ── Server action ─────────────────────────────────────────────────────────────
export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuth(request);
  // if (session.user.role !== "admin") {
  //   return Response.json({ error: "Unauthorized" }, { status: 403 });
  // }

  const body = await request.json() as CoursePayload;

  console.log("Received course payload:", body);

  // Basic validation
  if (!body.title?.trim()) return Response.json({ error: "Title is required" }, { status: 400 });
  if (!body.subject?.trim()) return Response.json({ error: "Subject is required" }, { status: 400 });
  if (!body.level) return Response.json({ error: "Level is required" }, { status: 400 });
  if (!body.modules?.length) return Response.json({ error: "Add at least one module" }, { status: 400 });

  const slug = body.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);

  // Insert course
  const [newCourse] = await db
    .insert(course)
    .values({
      title: body.title.trim(),
      thumbnailUrl: body.thumbnail || null,
      slug: `${slug}-${Date.now()}`,
      description: body.description?.trim() || null,
      level: body.level as "olevel" | "alevel",
      subject: body.subject.trim(),
      isPublished: body.publish ?? false,
    })
    .returning();

  // Insert modules + lessons
  for (let mi = 0; mi < body.modules.length; mi++) {
    const mod = body.modules[mi];
    if (!mod.title?.trim()) continue;

    const [newMod] = await db
      .insert(courseModule)
      .values({ courseId: newCourse.id, title: mod.title.trim(), order: mi + 1 })
      .returning();

    for (let li = 0; li < (mod.lessons ?? []).length; li++) {
      const lesson = mod.lessons[li];
      if (!lesson.youtubeVideoId?.trim()) continue;

      await db.insert(courseLesson).values({
        moduleId: newMod.id,
        title: lesson.title?.trim() || `Lesson ${li + 1}`,
        youtubeVideoId: lesson.youtubeVideoId.trim(),
        duration: lesson.duration ? Number(lesson.duration) : null,
        order: li + 1,
      });
    }
  }

  return { success: true, courseId: newCourse.id, slug: newCourse.slug };
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface LessonDraft {
  id: string;
  title: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  duration: string;
  urlValid: boolean | null;
}

interface ModuleDraft {
  id: string;
  title: string;
  open: boolean;
  lessons: LessonDraft[];
}

interface CoursePayload {
  title: string;
  description: string;
  level: string;
  subject: string;
  publish: boolean;
  modules: { title: string; lessons: { title: string; youtubeVideoId: string; duration: string }[] }[];
  thumbnail?: string;
}

const SUBJECTS = [
  "Mathematics", "Further Mathematics", "Physics", "Chemistry", "Biology",
  "English Language", "French", "Geography", "History", "Economics",
  "Computer Science", "Technical Drawing", "Food & Nutrition",
];

// ── YouTube ID extractor ──────────────────────────────────────────────────────
function extractYouTubeId(url: string): string | null {
  if (!url.trim()) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim();
  const re = /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/;
  const m = url.match(re);
  return m ? m[1] : null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);

function makeLesson(): LessonDraft {
  return { id: uid(), title: "", youtubeUrl: "", youtubeVideoId: "", duration: "", urlValid: null };
}
function makeModule(n: number): ModuleDraft {
  return { id: uid(), title: `Module ${n}`, open: true, lessons: [makeLesson()] };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdminNewCourse() {
  const navigate = useNavigate();

  // ── useFetcher replaces manual fetch() ──────────────────────────────────────
  // fetcher.submit() POSTs JSON to this route's action and gives us
  // fetcher.state ("idle" | "submitting" | "loading") plus fetcher.data
  // once the action returns — all without a full navigation.
  const fetcher = useFetcher<typeof action>();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<"olevel" | "alevel" | "">("");
  const [subject, setSubject] = useState("");
  const [publish, setPublish] = useState(false);
  const [modules, setModules] = useState<ModuleDraft[]>([makeModule(1)]);
  const [clientError, setClientError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
const [isDragging, setIsDragging] = useState(false);

function formatBytes(b: number) {
  if (b < 1024) return b + " B";
  if (b < 1048576) return Math.round(b / 1024) + " KB";
  return (b / 1048576).toFixed(1) + " MB";
}

function handleFile(file: File) {
  setImage(file);
  const reader = new FileReader();
  reader.onloadend = () => setImagePreview(reader.result as string);
  reader.readAsDataURL(file);
}


  // Derived state from fetcher
  const submitting = fetcher.state !== "idle";
  // Server-side error returned by the action
  const serverError = fetcher.data && "error" in fetcher.data
    ? (fetcher.data as { error: string }).error
    : null;
  const error = clientError ?? serverError;

  // React to action response
  useEffect(() => {
    if (!fetcher.data) return;

    if ("success" in fetcher.data && fetcher.data.success) {
      setDone(true);
      setTimeout(() => navigate(`/courses/${fetcher.data!.slug}`), 1200);
    }
  }, [fetcher.data, navigate]);

  // ── Module helpers ──────────────────────────────────────────────────────────
  const addModule = () =>
    setModules(ms => [...ms, makeModule(ms.length + 1)]);

  const removeModule = (mid: string) =>
    setModules(ms => ms.filter(m => m.id !== mid));

  const toggleModule = (mid: string) =>
    setModules(ms => ms.map(m => m.id === mid ? { ...m, open: !m.open } : m));

  const updateModuleTitle = (mid: string, title: string) =>
    setModules(ms => ms.map(m => m.id === mid ? { ...m, title } : m));

  // ── Lesson helpers ──────────────────────────────────────────────────────────
  const addLesson = (mid: string) =>
    setModules(ms => ms.map(m =>
      m.id === mid ? { ...m, lessons: [...m.lessons, makeLesson()] } : m
    ));

  const removeLesson = (mid: string, lid: string) =>
    setModules(ms => ms.map(m =>
      m.id === mid ? { ...m, lessons: m.lessons.filter(l => l.id !== lid) } : m
    ));

  const updateLesson = (mid: string, lid: string, patch: Partial<LessonDraft>) =>
    setModules(ms => ms.map(m =>
      m.id !== mid ? m : {
        ...m,
        lessons: m.lessons.map(l => l.id === lid ? { ...l, ...patch } : l),
      }
    ));

  const handleUrlChange = (mid: string, lid: string, raw: string) => {
    const extracted = extractYouTubeId(raw);
    updateLesson(mid, lid, {
      youtubeUrl: raw,
      youtubeVideoId: extracted ?? "",
      urlValid: raw.trim() === "" ? null : extracted !== null,
    });
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const { startUpload } = useCompressedUpload("imageUploader", {

    onClientUploadComplete: () => {
      // alert("uploaded successfully!");
      setLoading(false);
    },
    onUploadError: (ctx) => {
      setLoading(false);
      toast.error(`Failed to upload image`);
      console.log("error occurred while uploading");
    },
    onUploadBegin: (file) => {
      setLoading(true)
      // console.log("upload has begun for", file);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);

    if (!title.trim() || !level || !subject) {
      setClientError("Please fill in title, level, and subject.");
      return;
    }

    const uploadFiles = image ? await startUpload([image]) : null;
    let imageUrl = null;

    if (!uploadFiles) {
      imageUrl = null;

    }

    imageUrl = uploadFiles?.[0]?.ufsUrl;


    const payload: CoursePayload = {
      title, description, level, subject, publish,
      modules: modules.map(m => ({
        title: m.title,
        lessons: m.lessons
          .filter(l => l.youtubeVideoId)
          .map(l => ({ title: l.title, youtubeVideoId: l.youtubeVideoId, duration: l.duration })),
      })).filter(m => m.lessons.length > 0),
      thumbnail: imageUrl,
    };

    console.log("Submitting course payload:", payload);


    // Submit JSON to this route's action via the RR7 data layer.
    // encType "application/json" tells fetcher to send JSON (not FormData),
    // which matches the `request.json()` call in the action above.
    fetcher.submit(payload as any, {
      method: "POST",
      encType: "application/json",
    });
  };

  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.filter(l => l.youtubeVideoId).length, 0);

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // ── Success state ───────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <CheckCircle2 size={48} className="text-emerald-400 mx-auto" />
          <p className="text-white text-lg font-semibold">Course created!</p>
          <p className="text-zinc-400 text-sm">Redirecting…</p>
        </div>
      </div>
    );
  }



  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-32">

      {/* Top bar */}
      <header className="sticky top-0 z-20 backdrop-blur border-b border-zinc-800">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft size={15} /> Back
          </button>
          <span className="text-xs text-zinc-500 font-mono">
            {totalLessons} lesson{totalLessons !== 1 ? "s" : ""} ready
          </span>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-8 space-y-8">

        {/* Title block */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold tracking-widest uppercase">
            Course Title
          </label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g Calculus: Differential & Integral"
            required
            className="w-full bg-transparent border-b border-zinc-700 focus:border-purple-500 py-2 text-xl font-semibold placeholder:text-zinc-400 outline-none transition-colors placeholder:text-xs"
          />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
            Description <span className="text-zinc-600 normal-case">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What will students learn?"
            rows={2}
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none resize-none transition-colors"
          />
        </div>

        {/* Thumbnail upload */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase flex items-center justify-between">
            Thumbnail
            <span className="text-zinc-600 normal-case font-normal text-[11px] tracking-normal">
              optional · 16:9 recommended
            </span>
          </label>

          <div
            className={`relative rounded-xl border overflow-hidden cursor-pointer transition-all
      ${isDragging ? "border-purple-500 bg-zinc-900/80 border-solid" : ""}
      ${imagePreview ? "border-zinc-700 border-solid" : "border-dashed border-zinc-700 bg-zinc-900 hover:border-purple-500 hover:bg-zinc-900/60"}
    `}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => {
              e.preventDefault();
              setIsDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f?.type.startsWith("image/")) handleFile(f);
            }}
          >
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              ref={fileInputRef}
            />

            {!imagePreview ? (
              <div className="flex flex-col items-center justify-center gap-2.5 py-8 px-4 min-h-35">
                <div className="w-11 h-11 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                  <Upload size={16} className="text-zinc-400" />
                </div>
                <p className="text-sm text-zinc-400 text-center">
                  <span className="text-zinc-200 font-medium">Drop image here</span> or click to browse
                </p>
                <p className="text-[11px] text-zinc-600">PNG, JPG, WEBP · max 4MB</p>
              </div>
            ) : (
              <div className="relative group aspect-video w-full">
                <img src={imagePreview} alt="Thumbnail" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    className="opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all px-3 py-1.5 text-xs font-medium rounded-md bg-white/10 border border-white/20 text-white"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setImage(null); setImagePreview(null); }}
                    className="opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all px-3 py-1.5 text-xs font-medium rounded-md bg-white/10 border border-white/20 text-white hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent px-3 py-2 flex justify-between items-end">
                  <span className="text-[11px] text-zinc-300 font-medium truncate max-w-45">{image?.name}</span>
                  <span className="text-[10px] text-zinc-500">{image ? formatBytes(image.size) : ""}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Level + Subject row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Level</label>
            <div className="flex gap-2">
              {(["olevel", "alevel"] as const).map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLevel(l)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${level === l
                    ? "bg-purple-600 text-black border-purple-600"
                    : "bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500"
                    }`}
                >
                  {l === "olevel" ? "O-Level" : "A-Level"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Subject</label>
            <select
              value={subject}
              onChange={e => setSubject(e.target.value)}
              required
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors appearance-none cursor-pointer"
            >
              <option value="">Pick subject…</option>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-[10px] tracking-widest text-zinc-600 uppercase">Modules & Lessons</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {/* Modules */}
        <div className="space-y-4">
          {modules.map((mod, mi) => (
            <div key={mod.id} className="border border-zinc-800 rounded-xl overflow-hidden">

              {/* Module header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900">
                <GripVertical size={14} className="text-zinc-600 shrink-0" />

                <input
                  value={mod.title}
                  onChange={e => updateModuleTitle(mod.id, e.target.value)}
                  placeholder={`Module ${mi + 1} title`}
                  className="flex-1 bg-transparent text-sm font-semibold text-white placeholder:text-zinc-600 outline-none"
                />

                <span className="text-[10px] text-zinc-600 tabular-nums shrink-0">
                  {mod.lessons.filter(l => l.youtubeVideoId).length}/{mod.lessons.length}
                </span>

                <button
                  type="button"
                  onClick={() => toggleModule(mod.id)}
                  className="p-1 text-zinc-500 hover:text-white transition-colors"
                >
                  {mod.open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {modules.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeModule(mod.id)}
                    className="p-1 text-zinc-700 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>

              {/* Lessons */}
              {mod.open && (
                <div className="divide-y divide-zinc-900">
                  {mod.lessons.map((lesson, li) => (
                    <LessonRow
                      key={lesson.id}
                      lesson={lesson}
                      index={li}
                      onTitleChange={v => updateLesson(mod.id, lesson.id, { title: v })}
                      onUrlChange={v => handleUrlChange(mod.id, lesson.id, v)}
                      onDurationChange={v => updateLesson(mod.id, lesson.id, { duration: v })}
                      onRemove={() => removeLesson(mod.id, lesson.id)}
                      canRemove={mod.lessons.length > 1}
                    />
                  ))}

                  <button
                    type="button"
                    onClick={() => addLesson(mod.id)}
                    className="w-full py-3 text-xs text-zinc-500 hover:text-emerald-400 hover:bg-zinc-900/50 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus size={12} /> Add lesson
                  </button>
                </div>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addModule}
            className="w-full py-3 border border-dashed border-zinc-800 rounded-xl text-xs text-zinc-600 hover:text-white hover:border-zinc-600 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={13} /> Add module
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-950/50 border border-red-800/50 rounded-lg">
            <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Footer actions */}
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur border-t border-zinc-800 px-4 py-4">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            {/* Publish toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => setPublish(p => !p)}
                className={`w-10 h-5 rounded-full transition-colors relative ${publish ? "bg-purple-600" : "bg-zinc-700"
                  }`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${publish ? "translate-x-5" : "translate-x-0.5"
                  }`} />
              </div>
              <span className="text-xs text-zinc-400">
                {publish ? "Publish immediately" : "Save as draft"}
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting || loading}
              className="ml-auto flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-emerald-400 disabled:opacity-50 text-black text-sm font-bold rounded-lg transition-all active:scale-95"
            >
              {submitting || loading
                ? <><Loader2 size={14} className="animate-spin" /> Creating…</>
                : <><BookOpen size={14} /> Create Course</>
              }
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ── LessonRow ─────────────────────────────────────────────────────────────────
function LessonRow({
  lesson, index,
  onTitleChange, onUrlChange, onDurationChange,
  onRemove, canRemove,
}: {
  lesson: LessonDraft;
  index: number;
  onTitleChange: (v: string) => void;
  onUrlChange: (v: string) => void;
  onDurationChange: (v: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="px-4 py-3 bg-zinc-950 space-y-2.5">
      {/* Row 1: index + title + delete */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] tabular-nums text-zinc-600 w-5 shrink-0">{index + 1}.</span>
        <input
          value={lesson.title}
          onChange={e => onTitleChange(e.target.value)}
          placeholder={`Lesson ${index + 1} title`}
          className="flex-1 bg-transparent text-sm text-zinc-300 placeholder:text-zinc-600 outline-none"
        />
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-zinc-700 hover:text-red-400 transition-colors shrink-0"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {/* Row 2: YouTube URL + duration */}
      <div className="flex items-center gap-2 pl-7">
        <div className="flex-1 relative">
          <HugeiconsIcon size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" icon={YoutubeIcon} />
          <input
            value={lesson.youtubeUrl}
            onChange={e => onUrlChange(e.target.value)}
            placeholder="YouTube URL or video ID"
            className={`w-full pl-8 pr-3 py-1.5 bg-zinc-900 border rounded-lg text-xs text-zinc-300 placeholder:text-zinc-600 outline-none transition-colors ${lesson.urlValid === null
              ? "border-zinc-800"
              : lesson.urlValid
                ? "border-emerald-700 bg-emerald-950/20"
                : "border-red-800 bg-red-950/20"
              }`}
          />
          {lesson.urlValid && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-purple-600 bg-emerald-950 px-1.5 py-0.5 rounded">
              {lesson.youtubeVideoId}
            </span>
          )}
        </div>

        <input
          type="number"
          value={lesson.duration}
          onChange={e => onDurationChange(e.target.value)}
          placeholder="sec"
          min={0}
          className="w-16 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-400 placeholder:text-zinc-600 outline-none text-center"
        />
      </div>

      {lesson.urlValid === false && lesson.youtubeUrl && (
        <p className="pl-7 text-[10px] text-red-400 flex items-center gap-1">
          <AlertCircle size={10} /> Can't extract a YouTube ID from this URL
        </p>
      )}
    </div>
  );
}