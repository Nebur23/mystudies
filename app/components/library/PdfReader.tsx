/**
 * PdfReader.tsx
 * Full-featured PDF viewer — mobile-first, zoom-aware, scroll-synced.
 *
 * Features:
 *  - Sticky top toolbar: title, prev/next, page-jump input, zoom controls
 *  - Floating bottom bar: prev/next + live page counter (updates while scrolling)
 *  - Left sidebar (≥lg): thumbnail grid, auto-scrolls to active thumb, click to jump
 *  - Mobile sidebar: slide-up sheet toggled from toolbar
 *  - Zoom: resizes the white page card itself — no orphan whitespace
 *  - Scroll sync: reliable getBoundingClientRect approach (not IntersectionObserver ratios)
 *  - Both top toolbar AND floating bar reflect the active page live while scrolling
 */

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type KeyboardEvent,
} from "react";
import { Document, Page } from "react-pdf";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Loader2,
  AlertCircle,
  FileText,
  LayoutGrid,
  X,
} from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------

interface Props {
  fileUrl: string;
  title: string;
}

function toProxyUrl(url: string): string {
  try {
    const key = new URL(url).pathname.split("/").at(-1);
    return key ? `/api/library/proxy/${key}` : url;
  } catch {
    return url;
  }
}

const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const THUMB_WIDTH = 116; // px — sidebar thumbnail render width
// Gap (px) reserved around each page card (top+bottom padding in the scroll area)
const PAGE_GAP = 20;
// Horizontal padding inside the scroll container (each side)
const SCROLL_H_PAD = 12; // px on mobile; overridden on larger screens via JS

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PdfReader({ fileUrl, title }: Props) {
  // Refs
  const scrollRef = useRef<HTMLDivElement>(null); // the scrollable viewer column
  const containerRef = useRef<HTMLDivElement>(null); // outer wrapper — measured for width
  const sidebarRef = useRef<HTMLDivElement>(null); // desktop sidebar for thumb autoscroll
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]); // one per page

  // State
  const [mounted, setMounted] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [activePage, setActivePage] = useState(1);
  const [inputPage, setInputPage] = useState("1");
  const [zoom, setZoom] = useState(1.0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showThumbSheet, setShowThumbSheet] = useState(false); // mobile sheet

  const proxyUrl = toProxyUrl(fileUrl);

  // ------------------------------------------------------------------
  // Hydration guard (react-pdf needs window)
  // ------------------------------------------------------------------
  useEffect(() => setMounted(true), []);

  // ------------------------------------------------------------------
  // Measure the scroll-container width so page cards fit exactly
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // ------------------------------------------------------------------
  // Derive the page render width so the card fits the container exactly.
  // On mobile the horizontal padding is minimal (px-3 = 12 each side = 24).
  // On desktop (containerWidth > 640) we use px-6 = 24 each side = 48.
  // The zoom multiplier is applied AFTER fitting the base width.
  // ------------------------------------------------------------------
  const hPad = containerWidth > 640 ? 48 : 24; // total horizontal padding
  // Base width fits 100% of the container at zoom=1; zoom scales from there.
  const basePageWidth = containerWidth > 0 ? Math.max(containerWidth - hPad, 200) : 600;
  // Cap so it doesn't go ultra-wide on huge monitors, but let zoom exceed it
  const pageRenderWidth = Math.min(basePageWidth, 960) * zoom;

  // ------------------------------------------------------------------
  // Scroll-based active page detection (reliable across all zoom levels)
  // Uses getBoundingClientRect relative to the scroll container top.
  // The page whose top edge is closest to (and still below) the container
  // top + a small threshold is the "active" one.
  // ------------------------------------------------------------------
  const updateActivePage = useCallback(() => {
    const container = scrollRef.current;
    if (!container || pageRefs.current.length === 0) return;

    const containerTop = container.getBoundingClientRect().top;
    // Threshold: we consider the page "active" when its top is within the
    // top 40% of the visible scroll area.
    const threshold = container.clientHeight * 0.4;

    let best = 0;
    let bestDist = Infinity;

    pageRefs.current.forEach((el, i) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dist = Math.abs(rect.top - containerTop);
      if (rect.top - containerTop <= threshold && dist < bestDist) {
        bestDist = dist;
        best = i + 1;
      }
    });

    if (best > 0 && best !== activePage) {
      setActivePage(best);
    }
  }, [activePage]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateActivePage, { passive: true });
    return () => el.removeEventListener("scroll", updateActivePage);
  }, [updateActivePage]);

  // ------------------------------------------------------------------
  // Sync input and sidebar thumb whenever activePage changes
  // ------------------------------------------------------------------
  useEffect(() => {
    setInputPage(String(activePage));

    // Auto-scroll sidebar thumb into view
    const sidebar = sidebarRef.current;
    if (sidebar) {
      const thumb = sidebar.querySelector<HTMLElement>(`[data-thumb="${activePage}"]`);
      thumb?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [activePage]);

  // ------------------------------------------------------------------
  // Document load callback
  // ------------------------------------------------------------------
  const onLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setPageCount(numPages);
    setActivePage(1);
    setInputPage("1");
    pageRefs.current = Array(numPages).fill(null);
  }, []);

  // ------------------------------------------------------------------
  // Navigation helpers
  // ------------------------------------------------------------------
  const scrollToPage = useCallback((target: number) => {
    const el = pageRefs.current[target - 1];
    const container = scrollRef.current;
    if (!el || !container) return;
    // Use offsetTop relative to the scroll container's scrollable content
    container.scrollTo({ top: el.offsetTop - PAGE_GAP, behavior: "smooth" });
    setActivePage(target);
  }, []);

  const goTo = useCallback(
    (raw: string | number) => {
      const n = Math.max(1, Math.min(pageCount, Number(raw) || 1));
      scrollToPage(n);
    },
    [pageCount, scrollToPage]
  );

  const handleJump = useCallback(() => goTo(inputPage), [goTo, inputPage]);

  const handleJumpKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleJump();
  };

  // ------------------------------------------------------------------
  // Zoom helpers
  // ------------------------------------------------------------------
  const adjustZoom = (delta: number) =>
    setZoom((z) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, parseFloat((z + delta).toFixed(2)))));

  // ------------------------------------------------------------------
  // Loading / error guards
  // ------------------------------------------------------------------
  if (!mounted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3 text-stone-400">
        <Loader2 size={22} className="animate-spin" />
        <span className="text-sm">Preparing reader…</span>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Shared classes
  // ------------------------------------------------------------------
  const iconBtn =
    "inline-flex items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 transition hover:border-stone-300 hover:bg-stone-100 active:scale-95 disabled:opacity-40 select-none";

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
      style={{ height: "calc(100dvh - 72px)" }}>

      {/* ════════════════════════════════════════════════════════════
          TOP TOOLBAR
      ════════════════════════════════════════════════════════════ */}
      <div className="flex-none border-b border-stone-200 bg-stone-50">
        {/* Row 1: title + thumb toggle (mobile) + zoom */}
        <div className="flex items-center gap-2 px-3 py-2.5 sm:px-4">
          {/* Thumbnail sheet toggle — mobile only */}
          <button
            type="button"
            aria-label="Toggle page list"
            onClick={() => setShowThumbSheet((v) => !v)}
            className={`${iconBtn} h-9 w-9 lg:hidden`}
          >
            <LayoutGrid size={16} />
          </button>

          {/* Title */}
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <FileText size={15} className="hidden shrink-0 text-stone-400 sm:block" />
            <span className="truncate text-sm font-semibold text-stone-700">{title}</span>
          </div>

          {/* Zoom group */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => adjustZoom(-ZOOM_STEP)}
              disabled={zoom <= ZOOM_MIN}
              className={`${iconBtn} h-9 w-9`}
            >
              <ZoomOut size={16} />
            </button>
            <span className="w-12 text-center text-sm font-semibold tabular-nums text-stone-700">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => adjustZoom(ZOOM_STEP)}
              disabled={zoom >= ZOOM_MAX}
              className={`${iconBtn} h-9 w-9`}
            >
              <ZoomIn size={16} />
            </button>
          </div>
        </div>

        {/* Row 2: prev / page-jump / next — always visible */}
        <div className="flex items-center gap-2 border-t border-stone-100 px-3 pb-2.5 pt-2 sm:px-4">
          <button
            type="button"
            aria-label="Previous page"
            onClick={() => goTo(activePage - 1)}
            disabled={activePage <= 1}
            className={`${iconBtn} h-9 w-9`}
          >
            <ChevronLeft size={16} />
          </button>

          {/* Page jump input */}
          <div className="flex flex-1 items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-2.5 py-1.5">
            <input
              type="text"
              inputMode="numeric"
              value={inputPage}
              onChange={(e) => {
                if (/^[0-9]*$/.test(e.target.value)) setInputPage(e.target.value);
              }}
              onKeyDown={handleJumpKey}
              aria-label="Page number"
              className="min-w-0 flex-1 bg-transparent text-center text-sm font-semibold text-stone-900 outline-none"
            />
            <span className="shrink-0 text-xs text-stone-400">of {pageCount || "—"}</span>
            <button
              type="button"
              onClick={handleJump}
              className="shrink-0 rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-slate-700 active:scale-95"
            >
              Go
            </button>
          </div>

          <button
            type="button"
            aria-label="Next page"
            onClick={() => goTo(activePage + 1)}
            disabled={activePage >= pageCount}
            className={`${iconBtn} h-9 w-9`}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          BODY — sidebar + viewer
      ════════════════════════════════════════════════════════════ */}
      <div className="relative flex flex-1 overflow-hidden">

        {/* ── Desktop sidebar ───────────────────────────────────── */}
        <aside
          ref={sidebarRef}
          className="hidden lg:flex w-[152px] flex-none flex-col overflow-y-auto overscroll-contain border-r border-stone-100 bg-stone-50 py-3 gap-1.5 px-2"
          aria-label="Page thumbnails"
        >
          {/* The sidebar gets its own Document so thumbnails load independently */}
          <Document file={proxyUrl} loading={null} error={null}>
            {Array.from({ length: pageCount }, (_, i) => {
              const n = i + 1;
              const active = n === activePage;
              return (
                <button
                  key={n}
                  type="button"
                  data-thumb={n}
                  onClick={() => scrollToPage(n)}
                  aria-label={`Go to page ${n}`}
                  aria-current={active ? "page" : undefined}
                  className={`group flex w-full flex-col items-center gap-1 rounded-xl p-1.5 transition ${
                    active
                      ? "bg-slate-900 shadow-sm"
                      : "hover:bg-stone-200/60 active:bg-stone-200"
                  }`}
                >
                  <div
                    className={`overflow-hidden rounded-lg border bg-white ${
                      active ? "border-slate-600 ring-1 ring-slate-700" : "border-stone-200"
                    }`}
                  >
                    <Page
                      pageNumber={n}
                      width={THUMB_WIDTH}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      loading={
                        <div
                          className="flex items-center justify-center bg-stone-50"
                          style={{ width: THUMB_WIDTH, height: Math.round(THUMB_WIDTH * 1.414) }}
                        >
                          <Loader2 size={12} className="animate-spin text-stone-300" />
                        </div>
                      }
                    />
                  </div>
                  <span
                    className={`text-[11px] font-semibold tabular-nums ${
                      active ? "text-white" : "text-stone-500"
                    }`}
                  >
                    {n}
                  </span>
                </button>
              );
            })}
          </Document>
        </aside>

        {/* ── Mobile thumbnail sheet (slide-up overlay) ─────────── */}
        {showThumbSheet && (
          <div className="absolute inset-0 z-20 flex flex-col bg-white lg:hidden">
            <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
              <p className="text-sm font-semibold text-stone-700">Pages</p>
              <button
                type="button"
                aria-label="Close page list"
                onClick={() => setShowThumbSheet(false)}
                className={`${iconBtn} h-9 w-9`}
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="grid grid-cols-3 gap-3 p-4">
                <Document file={proxyUrl} loading={null} error={null}>
                  {Array.from({ length: pageCount }, (_, i) => {
                    const n = i + 1;
                    const active = n === activePage;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => {
                          scrollToPage(n);
                          setShowThumbSheet(false);
                        }}
                        aria-label={`Go to page ${n}`}
                        className={`flex flex-col items-center gap-1.5 rounded-xl p-1.5 transition ${
                          active ? "bg-slate-900" : "hover:bg-stone-100 active:bg-stone-200"
                        }`}
                      >
                        <div
                          className={`overflow-hidden rounded-lg border bg-white ${
                            active ? "border-slate-600 ring-1 ring-slate-700" : "border-stone-200"
                          }`}
                        >
                          <Page
                            pageNumber={n}
                            width={88}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            loading={
                              <div className="flex h-[124px] w-[88px] items-center justify-center bg-stone-50">
                                <Loader2 size={10} className="animate-spin text-stone-300" />
                              </div>
                            }
                          />
                        </div>
                        <span
                          className={`text-[10px] font-semibold tabular-nums ${
                            active ? "text-white" : "text-stone-500"
                          }`}
                        >
                          {n}
                        </span>
                      </button>
                    );
                  })}
                </Document>
              </div>
            </div>
          </div>
        )}

        {/* ── Main scrollable viewer ────────────────────────────── */}
        <div ref={containerRef} className="relative flex flex-1 flex-col overflow-hidden bg-stone-200/60">
          {loadError ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
              <AlertCircle size={36} className="text-stone-400" />
              <p className="text-base font-semibold text-stone-900">Unable to load PDF</p>
              <p className="text-sm text-stone-500">{loadError}</p>
            </div>
          ) : (
            <div
              ref={scrollRef}
              className="h-full overflow-y-auto overscroll-contain"
              // Horizontal padding adapts via inline style so cards fill width at all zoom levels
              style={{ padding: `${PAGE_GAP}px ${hPad / 2}px` }}
            >
              <Document
                file={proxyUrl}
                onLoadSuccess={onLoadSuccess}
                onLoadError={(err) => setLoadError(String(err))}
                loading={
                  <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
                    <Loader2 size={28} className="animate-spin text-stone-400" />
                    <p className="text-sm text-stone-400">Loading PDF…</p>
                  </div>
                }
                error={
                  <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
                    <AlertCircle size={32} className="text-stone-400" />
                    <p className="text-sm font-semibold text-stone-900">Preview unavailable</p>
                  </div>
                }
              >
                {Array.from({ length: pageCount }, (_, i) => {
                  const n = i + 1;
                  return (
                    <div
                      key={n}
                      ref={(node) => { pageRefs.current[i] = node; }}
                      data-page={n}
                      // The card wraps tightly around the page content.
                      // mx-auto centres it; width is driven by pageRenderWidth.
                      className="mx-auto mb-5 overflow-hidden rounded-xl bg-white shadow"
                      style={{ width: pageRenderWidth }}
                    >
                      {/* Page header strip */}
                      <div className="flex items-center justify-between border-b border-stone-100 px-4 py-2 text-[11px] text-stone-400">
                        <span className="max-w-[60%] truncate font-medium">{title}</span>
                        <span className="tabular-nums">
                          {n} / {pageCount}
                        </span>
                      </div>

                      {/* react-pdf Page — rendered at exact card width, no extra padding */}
                      <Page
                        pageNumber={n}
                        width={pageRenderWidth}
                        renderTextLayer
                        renderAnnotationLayer={false}
                        loading={
                          <div
                            className="flex items-center justify-center bg-stone-50"
                            style={{
                              width: pageRenderWidth,
                              height: Math.round(pageRenderWidth * 1.414),
                            }}
                          >
                            <Loader2 size={18} className="animate-spin text-stone-300" />
                          </div>
                        }
                      />
                    </div>
                  );
                })}
              </Document>
            </div>
          )}

          {/* ── Floating bottom bar ────────────────────────────── */}
          {pageCount > 0 && (
            <div
              className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 pointer-events-none"
              aria-live="polite"
              aria-atomic="true"
            >
              <div className="pointer-events-auto flex items-center gap-1.5 rounded-2xl border border-stone-200/80 bg-white/90 px-3 py-2 shadow-lg backdrop-blur-md">
                <button
                  type="button"
                  aria-label="Previous page"
                  onClick={() => goTo(activePage - 1)}
                  disabled={activePage <= 1}
                  className={`${iconBtn} h-9 w-9 border-0 hover:bg-stone-100`}
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Progress bar + label */}
                <div className="flex flex-col items-center gap-1 px-1">
                  <span className="text-sm font-semibold tabular-nums text-stone-700">
                    {activePage} <span className="font-normal text-stone-400">/</span> {pageCount}
                  </span>
                  <div className="h-1 w-28 overflow-hidden rounded-full bg-stone-200">
                    <div
                      className="h-full rounded-full bg-slate-800 transition-all duration-200"
                      style={{ width: `${(activePage / pageCount) * 100}%` }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Next page"
                  onClick={() => goTo(activePage + 1)}
                  disabled={activePage >= pageCount}
                  className={`${iconBtn} h-9 w-9 border-0 hover:bg-stone-100`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}