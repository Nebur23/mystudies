"use client";

// ~/components/PdfPreviewClient.tsx
// Uses dynamic import + mounted guard so react-pdf is NEVER touched by SSR.

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Download, Loader2, AlertCircle, Star,
} from "lucide-react";

interface Props {
  fileUrl:    string;
  maxPages:   number;
  isPremium:  boolean;
  onDownload: () => void;
}

// Module-level cache so we only import once across navigations
type PdfModule = typeof import("react-pdf");
let cachedModule: PdfModule | null = null;

export default function PdfPreviewClient({
  fileUrl,
  maxPages,
  isPremium,
  onDownload,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [mounted,    setMounted]    = useState(false);
  const [pdfMod,     setPdfMod]     = useState<PdfModule | null>(cachedModule);
  const [page,       setPage]       = useState(1);
  const [zoom,       setZoom]       = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [limitHit,   setLimitHit]   = useState(false);
  const [width,      setWidth]      = useState(680);

  // ── Step 1: after hydration, dynamically import react-pdf ─────────────────
  // useEffect never runs on the server, so pdfjs-dist is never evaluated in Node
  useEffect(() => {
    setMounted(true);

    if (cachedModule) {
      setPdfMod(cachedModule);
      return;
    }

    import("react-pdf").then((mod) => {
      mod.pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      cachedModule = mod;
      setPdfMod(mod);
    });
  }, []);

  // ── Step 2: track container width for responsive scaling ──────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width || 680);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [mounted]);

  const effectiveMax = isPremium ? maxPages : (totalPages || maxPages);

  const goNext = () => {
    if (page >= effectiveMax) { setLimitHit(true); return; }
    setPage(p => p + 1);
    setLimitHit(false);
  };

  const goPrev = () => {
    setPage(p => Math.max(1, p - 1));
    setLimitHit(false);
  };

  const onLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setTotalPages(numPages);
  }, []);

  const showOverlay = limitHit || (isPremium && page > 1);

  // ── Render nothing meaningful until we're in the browser ──────────────────
  if (!mounted || !pdfMod) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 flex items-center justify-center gap-2 py-16 shadow-sm">
        <Loader2 size={20} className="animate-spin text-stone-400" />
        <span className="text-sm text-stone-400">Loading preview…</span>
      </div>
    );
  }

  // Destructure only after the dynamic import resolved
  const { Document, Page } = pdfMod;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">

      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-stone-50 border-b border-stone-100">
        <div className="flex items-center gap-1">
          <button
            onClick={goPrev}
            disabled={page === 1}
            className="p-1.5 rounded-lg hover:bg-stone-200 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={16} className="text-stone-600" />
          </button>
          <span className="text-xs text-stone-500 tabular-nums px-1 min-w-20 text-center">
            {totalPages
              ? `Page ${page} of ${isPremium ? `${maxPages}*` : totalPages}`
              : "Loading…"}
          </span>
          <button
            onClick={goNext}
            disabled={page >= effectiveMax}
            className="p-1.5 rounded-lg hover:bg-stone-200 disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={16} className="text-stone-600" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2)))}
            className="p-1.5 rounded-lg hover:bg-stone-200 transition-colors"
          >
            <ZoomOut size={15} className="text-stone-600" />
          </button>
          <span className="text-xs text-stone-400 tabular-nums w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(z => Math.min(3, +(z + 0.25).toFixed(2)))}
            className="p-1.5 rounded-lg hover:bg-stone-200 transition-colors"
          >
            <ZoomIn size={15} className="text-stone-600" />
          </button>
        </div>
      </div>

      {/* ── PDF canvas ─────────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="relative bg-stone-100 overflow-auto flex justify-center"
        style={{ minHeight: 480 }}
      >
        <Document
          file={fileUrl}
          onLoadSuccess={onLoadSuccess}
          loading={
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Loader2 size={24} className="animate-spin text-stone-400" />
              <p className="text-xs text-stone-400">Loading preview…</p>
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <AlertCircle size={32} className="text-stone-400" />
              <p className="text-sm text-stone-500">Preview unavailable</p>
              <button
                onClick={onDownload}
                className="text-xs text-amber-600 font-semibold hover:underline"
              >
                Download to view
              </button>
            </div>
          }
        >
          <Page
            pageNumber={page}
            width={width * zoom}
            className="my-4 shadow-md"
            loading={
              <div className="flex items-center justify-center" style={{ minHeight: 400 }}>
                <Loader2 size={20} className="animate-spin text-stone-400" />
              </div>
            }
            renderTextLayer
            renderAnnotationLayer={false}
          />
        </Document>

        {showOverlay && (
          <div className="absolute inset-0 bg-stone-50/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-6 z-10">
            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center">
              <Star size={26} className="text-amber-500 fill-current" />
            </div>
            <div className="text-center">
              <p className="font-bold text-stone-900">
                {isPremium ? "Premium resource" : "Preview limit reached"}
              </p>
              <p className="text-sm text-stone-500 mt-1">
                {isPremium
                  ? "Unlock this resource to view the full document"
                  : "Download the full document to continue reading"}
              </p>
            </div>
            <button
              onClick={onDownload}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isPremium
                  ? "bg-amber-500 hover:bg-amber-600 text-white"
                  : "bg-stone-900 hover:bg-stone-800 text-white"
              }`}
            >
              <Download size={14} />
              {isPremium ? "Unlock & Download" : "Download Full PDF"}
            </button>
          </div>
        )}
      </div>

      {isPremium && (
        <p className="px-4 py-2 text-[10px] text-stone-400 bg-stone-50 border-t border-stone-100">
          * Preview limited to {maxPages} page{maxPages !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}