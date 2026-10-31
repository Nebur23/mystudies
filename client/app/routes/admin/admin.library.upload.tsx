import { useState, useRef, useEffect } from "react";
import { useFetcher, useNavigate, useLoaderData } from "react-router";
import {
    Upload, FileText, X, CheckCircle2,
    Loader2, AlertCircle, ArrowLeft, Star,
} from "lucide-react";
import { requireAuth } from "~/lib/auth";
import { db } from "~/db";
import { resource, resourceCategory } from "~/db/schema/library";
import { asc } from "drizzle-orm";
import type { Route } from "./+types/admin.library.upload";
import { useCompressedUpload } from "~/utils/uploadthing";
import { toast } from "sonner";

const SUBJECTS = [
    "Mathematics", "Further Mathematics", "Physics", "Chemistry", "Biology",
    "English Language", "French", "Geography", "History", "Economics",
    "Computer Science", "Technical Drawing", "Food & Nutrition",
];

const ACCEPTED_TYPES = ".pdf,.doc,.docx,.zip,.ppt,.pptx";
const MAX_FILE_MB = 256;

// ── Loader ────────────────────────────────────────────────────────────────────
export async function loader({ request }: Route.LoaderArgs) {
    const session = await requireAuth(request);
    // if (session.user.role !== "admin") throw new Response("Unauthorized", { status: 403 });

    const categories = await db
        .select({ id: resourceCategory.id, name: resourceCategory.name, icon: resourceCategory.icon })
        .from(resourceCategory)
        .orderBy(asc(resourceCategory.order));

    return { categories };
}

// ── Action ────────────────────────────────────────────────────────────────────
export async function action({ request }: Route.ActionArgs) {
    const session = await requireAuth(request);
    const formData = await request.formData();

    const title = (formData.get("title") as string)?.trim();
    const categoryId = (formData.get("categoryId") as string)?.trim();
    const subject = (formData.get("subject") as string)?.trim();
    const levelRaw = formData.get("level") as string;
    const year = formData.get("year") as string;
    const description = (formData.get("description") as string)?.trim();
    const fileUrl = (formData.get("fileUrl") as string)?.trim();
    const thumbnailUrl = (formData.get("thumbnailUrl") as string)?.trim() || null;
    const fileType = (formData.get("fileType") as string)?.trim();
    const fileSize = formData.get("fileSize") as string;
    const isPublished = formData.get("isPublished") === "true";
    const isPremium = formData.get("isPremium") === "true";

    if (!title || !categoryId || !subject || !levelRaw || !fileUrl || !fileType) {
        return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const slug = `${title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 80)}-${Date.now()}`;

    await db.insert(resource).values({
        title,
        slug,
        categoryId,
        subject,
        level: levelRaw as "olevel" | "alevel" | "both",
        year: year ? parseInt(year) : null,
        description: description || null,
        fileUrl,
        thumbnailUrl,           // ✅ stored from UploadThing
        fileType: fileType as any,
        fileSize: fileSize ? parseInt(fileSize) : null,
        isPublished,
        isPremium,
        uploadedBy: session.user.id,
    });

    return Response.json({ success: true });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatBytes(b: number) {
    if (b < 1024) return `${b} B`;
    if (b < 1_048_576) return `${Math.round(b / 1024)} KB`;
    return `${(b / 1_048_576).toFixed(1)} MB`;
}

function fileTypeFromName(name: string) {
    return name.split(".").pop()?.toLowerCase() ?? "pdf";
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdminUploadPage() {
    const { categories } = useLoaderData<typeof loader>();
    const fetcher = useFetcher<{ success?: boolean; error?: string }>();
    const navigate = useNavigate();

    // Resource file state
    const resourceInputRef = useRef<HTMLInputElement>(null);
    const [resourceFile, setResourceFile] = useState<File | null>(null);
    const [isDraggingFile, setIsDraggingFile] = useState(false);


    // Thumbnail state (mirrors course upload exactly)
    const thumbnailInputRef = useRef<HTMLInputElement>(null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [isDraggingThumb, setIsDraggingThumb] = useState(false);


    // Upload state
    const [isUploadingThumb, setIsUploadingThumb] = useState(false);
    const [isUploadingResource, setIsUploadingResource] = useState(false);


    const [form, setForm] = useState({
        title: "",
        categoryId: "",
        level: "olevel" as "olevel" | "alevel" | "both",
        subject: "",
        year: "",
        description: "",
        isPublished: false,
        isPremium: false,
    });

    // ── UploadThing — same hook/router as course thumbnail ────────────────────
    const { startUpload: startThumbnailUpload } = useCompressedUpload("imageUploader", {
        onUploadBegin: () => setIsUploadingThumb(true),
        onClientUploadComplete: () => setIsUploadingThumb(false),
        onUploadError: () => {
            setIsUploadingThumb(false);
            toast.error("Thumbnail upload failed");
        },
    });

    const { startUpload: startResourceUpload } = useCompressedUpload("resourceUploader", {
        onUploadBegin: () => setIsUploadingResource(true),
        onClientUploadComplete: () => setIsUploadingResource(false),
        onUploadError: () => {
            setIsUploadingResource(false);
            toast.error("Resource file upload failed");
        },
    });


    // Redirect after success
    useEffect(() => {
        if (fetcher.state === "idle" && fetcher.data?.success) {
            toast.success("Resource uploaded!");
            setTimeout(() => navigate("/library"), 1000);
        }
    }, [fetcher.state, fetcher.data, navigate]);

    // ── Thumbnail file handler ────────────────────────────────────────────────
    function handleThumbnailFile(file: File) {
        setThumbnailFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setThumbnailPreview(reader.result as string);
        reader.readAsDataURL(file);
    }

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resourceFile) {
            toast.error("Please select a resource file");
            return;
        }

        // 1. Upload both files in parallel — faster than sequential
        const [thumbnailResult, resourceResult] = await Promise.all([
            thumbnailFile ? startThumbnailUpload([thumbnailFile]) : Promise.resolve(null),
            startResourceUpload([resourceFile]),
        ]);

        const thumbnailUrl = thumbnailResult?.[0]?.ufsUrl ?? null;
        const resourceUrl = resourceResult?.[0]?.ufsUrl;

        if (!resourceUrl) {
            toast.error("Resource upload failed — please try again");
            return;
        }

        // 2. Submit metadata to the action with the real UploadThing URLs
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
        fd.append("fileUrl", resourceUrl);        // ✅ real UploadThing URL
        fd.append("thumbnailUrl", thumbnailUrl ?? ""); // ✅ real UploadThing URL
        fd.append("fileType", fileTypeFromName(resourceFile.name));
        fd.append("fileSize", String(resourceFile.size));

        fetcher.submit(fd, { method: "POST" });
    };

    const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
        setForm(f => ({ ...f, [k]: v }));

    const isSubmitting =
        fetcher.state === "submitting" ||
        isUploadingThumb ||
        isUploadingResource;

    const slug = form.title
        .toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 60);

    return (
        <div
            className="min-h-screen bg-zinc-950 text-zinc-100 pb-28"
            style={{ fontFamily: "'DM Mono', monospace" }}
        >
            {/* Header */}
            <header className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur border-b border-zinc-800">
                <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-colors"
                    >
                        <ArrowLeft size={15} /> Back
                    </button>
                    <span className="text-xs text-zinc-600">Upload Resource</span>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-8 space-y-7">

                {/* ── Resource file drop zone ──────────────────────────────────────── */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                        Resource File <span className="text-red-500">*</span>
                    </label>
                    <div
                        onClick={() => resourceInputRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); setIsDraggingFile(true); }}
                        onDragLeave={() => setIsDraggingFile(false)}
                        onDrop={e => {
                            e.preventDefault();
                            setIsDraggingFile(false);
                            const f = e.dataTransfer.files?.[0];
                            if (f && f.size <= MAX_FILE_MB * 1_048_576) setResourceFile(f);
                        }}
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDraggingFile
                            ? "border-emerald-500 bg-emerald-950/20"
                            : resourceFile
                                ? "border-emerald-700 bg-emerald-950/10"
                                : "border-zinc-700 hover:border-zinc-500"
                            }`}
                    >
                        {resourceFile ? (
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-10 h-10 bg-emerald-900/50 rounded-lg flex items-center justify-center shrink-0">
                                    <FileText size={18} className="text-emerald-400" />
                                </div>
                                <div className="text-left min-w-0">
                                    <p className="text-sm font-semibold text-zinc-200 truncate max-w-52">
                                        {resourceFile.name}
                                    </p>
                                    <p className="text-xs text-zinc-500 mt-0.5">
                                        {fileTypeFromName(resourceFile.name).toUpperCase()} · {formatBytes(resourceFile.size)}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={e => { e.stopPropagation(); setResourceFile(null); }}
                                    className="ml-auto p-1.5 hover:bg-zinc-800 rounded-full shrink-0"
                                >
                                    <X size={14} className="text-zinc-500" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <Upload size={28} className="mx-auto text-zinc-600 mb-3" />
                                <p className="text-sm text-zinc-400 font-medium">
                                    <span className="text-zinc-200">Drop file here</span> or click to browse
                                </p>
                                <p className="text-xs text-zinc-600 mt-1">PDF, DOC, ZIP, PPT — max {MAX_FILE_MB} MB</p>
                            </>
                        )}
                        <input
                            ref={resourceInputRef}
                            type="file"
                            accept={ACCEPTED_TYPES}
                            className="hidden"
                            onChange={e => {
                                const f = e.target.files?.[0];
                                if (f && f.size <= MAX_FILE_MB * 1_048_576) setResourceFile(f);
                                else if (f) toast.error(`File too large — max ${MAX_FILE_MB} MB`);
                            }}
                        />
                    </div>
                </div>

                {/* ── Thumbnail (UploadThing — identical pattern to course upload) ── */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase flex items-center justify-between">
                        Thumbnail
                        <span className="text-zinc-600 normal-case font-normal text-[11px] tracking-normal">
                            optional · 16:9 recommended
                        </span>
                    </label>

                    <div
                        onDragOver={e => { e.preventDefault(); setIsDraggingThumb(true); }}
                        onDragLeave={() => setIsDraggingThumb(false)}
                        onDrop={e => {
                            e.preventDefault();
                            setIsDraggingThumb(false);
                            const f = e.dataTransfer.files?.[0];
                            if (f?.type.startsWith("image/")) handleThumbnailFile(f);
                        }}
                        className={`relative rounded-xl border overflow-hidden cursor-pointer transition-all ${isDraggingThumb
                            ? "border-solid border-emerald-500 bg-zinc-900/80"
                            : thumbnailPreview
                                ? "border-solid border-zinc-700"
                                : "border-dashed border-zinc-700 bg-zinc-900 hover:border-emerald-500 hover:bg-zinc-900/60"
                            }`}
                    >
                        <input
                            ref={thumbnailInputRef}
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            onChange={e => {
                                const f = e.target.files?.[0];
                                if (f) handleThumbnailFile(f);
                            }}
                        />

                        {!thumbnailPreview ? (
                            <div
                                className="flex flex-col items-center justify-center gap-2.5 py-8 px-4 min-h-32.5"
                                onClick={() => thumbnailInputRef.current?.click()}
                            >
                                <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                                    <Upload size={15} className="text-zinc-400" />
                                </div>
                                <p className="text-sm text-zinc-400 text-center">
                                    <span className="text-zinc-200 font-medium">Drop image here</span> or click to browse
                                </p>
                                <p className="text-[11px] text-zinc-600">PNG, JPG, WEBP · max 4 MB</p>
                            </div>
                        ) : (
                            <div className="relative group aspect-video w-full">
                                <img
                                    src={thumbnailPreview}
                                    alt="Thumbnail preview"
                                    className="w-full h-full object-cover"
                                />
                                {/* Hover overlay — same as course upload */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2 z-20">
                                    <button
                                        type="button"
                                        onClick={e => { e.stopPropagation(); thumbnailInputRef.current?.click(); }}
                                        className="opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all px-3 py-1.5 text-xs font-medium rounded-md bg-white/10 border border-white/20 text-white"
                                    >
                                        Change
                                    </button>
                                    <button
                                        type="button"
                                        onClick={e => {
                                            e.stopPropagation();
                                            setThumbnailFile(null);
                                            setThumbnailPreview(null);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all px-3 py-1.5 text-xs font-medium rounded-md bg-white/10 border border-white/20 text-white hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-300"
                                    >
                                        Remove
                                    </button>
                                </div>
                                {/* File info bar */}
                                <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent px-3 py-2 flex justify-between items-end z-10 pointer-events-none">
                                    <span className="text-[11px] text-zinc-300 truncate max-w-45">{thumbnailFile?.name}</span>
                                    <span className="text-[10px] text-zinc-500">{thumbnailFile ? formatBytes(thumbnailFile.size) : ""}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-zinc-800" />
                    <span className="text-[10px] tracking-widest text-zinc-600 uppercase">Metadata</span>
                    <div className="flex-1 h-px bg-zinc-800" />
                </div>

                {/* Title */}
                <div className="space-y-1">
                    <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Title</label>
                    <input
                        value={form.title}
                        onChange={e => set("title", e.target.value)}
                        required
                        placeholder="e.g. Mathematics Paper 1 — 2024"
                        className="w-full bg-transparent border-b border-zinc-700 focus:border-emerald-500 py-2 text-base text-white placeholder:text-zinc-600 outline-none transition-colors"
                    />
                    {form.title && (
                        <p className="text-[10px] text-zinc-600 font-mono">/library/{slug}…</p>
                    )}
                </div>

                {/* Category + Level */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Category</label>
                        <select
                            required
                            value={form.categoryId}
                            onChange={e => set("categoryId", e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none appearance-none"
                        >
                            <option value="">Select…</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Level</label>
                        <div className="flex gap-1.5 pt-0.5">
                            {(["olevel", "alevel", "both"] as const).map(l => (
                                <button
                                    key={l}
                                    type="button"
                                    onClick={() => set("level", l)}
                                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold border transition-all ${form.level === l
                                        ? "bg-emerald-500 text-black border-emerald-500"
                                        : "bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500"
                                        }`}
                                >
                                    {l === "olevel" ? "O-Lvl" : l === "alevel" ? "A-Lvl" : "Both"}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Subject + Year */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Subject</label>
                        <select
                            required
                            value={form.subject}
                            onChange={e => set("subject", e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none"
                        >
                            <option value="">Select…</option>
                            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                            Year <span className="text-zinc-600 normal-case">(optional)</span>
                        </label>
                        <input
                            type="number"
                            value={form.year}
                            onChange={e => set("year", e.target.value)}
                            min={1990}
                            max={new Date().getFullYear()}
                            placeholder="e.g. 2024"
                            className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none"
                        />
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                    <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                        Description <span className="text-zinc-600 normal-case">(optional)</span>
                    </label>
                    <textarea
                        value={form.description}
                        onChange={e => set("description", e.target.value)}
                        rows={2}
                        placeholder="Brief description for students…"
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none resize-none"
                    />
                </div>

                {/* Error / success feedback */}
                {fetcher.data?.error && (
                    <div className="flex items-center gap-2 p-3 bg-red-950/50 border border-red-800/50 rounded-lg">
                        <AlertCircle size={14} className="text-red-400 shrink-0" />
                        <p className="text-red-300 text-sm">{fetcher.data.error}</p>
                    </div>
                )}
                {fetcher.data?.success && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-950/50 border border-emerald-800/50 rounded-lg">
                        <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                        <p className="text-emerald-300 text-sm">Uploaded! Redirecting…</p>
                    </div>
                )}

                {/* ── Sticky footer ── */}
                <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur border-t border-zinc-800 px-4 py-4">
                    <div className="max-w-2xl mx-auto flex items-center gap-4">

                        {/* Publish toggle */}
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <div
                                onClick={() => set("isPublished", !form.isPublished)}
                                className={`w-9 h-5 rounded-full relative transition-colors ${form.isPublished ? "bg-emerald-500" : "bg-zinc-700"
                                    }`}
                            >
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.isPublished ? "translate-x-4" : "translate-x-0.5"
                                    }`} />
                            </div>
                            <span className="text-xs text-zinc-400">
                                {form.isPublished ? "Published" : "Draft"}
                            </span>
                        </label>

                        {/* Premium toggle */}
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <div
                                onClick={() => set("isPremium", !form.isPremium)}
                                className={`w-9 h-5 rounded-full relative transition-colors ${form.isPremium ? "bg-amber-500" : "bg-zinc-700"
                                    }`}
                            >
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.isPremium ? "translate-x-4" : "translate-x-0.5"
                                    }`} />
                            </div>
                            <span className="text-xs text-zinc-400 flex items-center gap-1">
                                {form.isPremium && <Star size={10} className="text-amber-400 fill-current" />}
                                {form.isPremium ? "Premium" : "Free"}
                            </span>
                        </label>

                        <button
                            type="submit"
                            disabled={!resourceFile || isSubmitting}
                            className="ml-auto flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-sm font-bold rounded-lg transition-all active:scale-95"
                        >
                            {isSubmitting
                                ? <>
                                    <Loader2 size={14} className="animate-spin" />
                                    {isUploadingResource
                                        ? "Uploading file…"
                                        : isUploadingThumb
                                            ? "Uploading thumbnail…"
                                            : "Saving…"}
                                </>
                                : <><Upload size={14} /> Upload Resource</>
                            }
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}