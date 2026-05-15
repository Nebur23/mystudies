import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import ReactPlayer from "react-player";   // ✅ v3: unified import, not react-player/youtube
import { CheckCircle2 } from "lucide-react";
import Duration from "./Duration";

interface MediaPlayerProps {
  /** Full URL or YouTube/Vimeo/etc URL */
  url: string;
  lessonId: string;
  initialWatched: number;
  isCompleted: boolean;
  onComplete: (lessonId: string, watchedSeconds: number) => void;
  onProgress: (lessonId: string, watchedSeconds: number) => void;
  /** Optional extra config merged into ReactPlayer config prop */
  playerConfig?: Record<string, unknown>;
  playing?: boolean;
  controls?: boolean;
  /** Poster image or true for YouTube's default thumbnail */
  light?: boolean | string;
  className?: string;
}

const SAVE_INTERVAL_MS   = 15_000;
const COMPLETE_THRESHOLD = 0.92;

export const MediaPlayer = memo(function MediaPlayer({
  url,
  lessonId,
  initialWatched,
  isCompleted,
  onComplete,
  onProgress,
  playerConfig,
  playing  = false,
  controls = true,
  light    = false,
  className,
}: MediaPlayerProps) {
  const fetcher = useFetcher();

  // ✅ v3: ref type is HTMLVideoElement (the underlying element), not ReactPlayer instance
  const playerRef       = useRef<HTMLVideoElement | null>(null);
  const durationRef     = useRef<number>(0);
  const playedSecondsRef = useRef<number>(initialWatched);
  const completedRef    = useRef<boolean>(isCompleted);
  const lastSaveRef     = useRef<number>(0);
  const isSavingRef     = useRef<boolean>(false);
  const seekedRef       = useRef<boolean>(false); // guard: only resume-seek once

  const [seeking,            setSeeking]            = useState(false);
  const [played,             setPlayed]             = useState(0);
  const [hasStarted,         setHasStarted]         = useState(false);
  const [showCompletedBadge, setShowCompletedBadge] = useState(isCompleted);

  // ── Ref callback — v3 exposes the raw HTMLVideoElement ───────────────────
  const setPlayerRef = useCallback((el: HTMLVideoElement) => {
    if (!el) return;
    playerRef.current = el;
  }, []);

  // ── Resume position — seek once after first duration is known ────────────
  // Can't seek in useEffect([]) because the player may not have loaded yet.
  // Instead we seek the first time we get a durationChange event.
  const handleDurationChange = () => {
    const player = playerRef.current;
    if (!player) return;
    durationRef.current = player.duration;

    // Resume to last watched position (once, on mount)
    if (!seekedRef.current && initialWatched > 10) {
      seekedRef.current = true;
      player.currentTime = initialWatched;
    }

    // Sync played fraction
    if (player.duration > 0) {
      setPlayed(player.currentTime / player.duration);
    }
  };

  // ── Progress save helper ─────────────────────────────────────────────────
  const saveProgress = useCallback(
    (seconds: number, completed: boolean, force = false) => {
      if (isSavingRef.current) return;

      const now = Date.now();
      if (!force && !completed && now - lastSaveRef.current < SAVE_INTERVAL_MS) return;

      lastSaveRef.current = now;
      isSavingRef.current = true;

      const watchedSeconds = Math.round(seconds);

      // ✅ Use sendBeacon for beforeunload (fire-and-forget, survives page close)
      if (force && typeof navigator !== "undefined" && navigator.sendBeacon) {
        const fd = new FormData();
        fd.append("lessonId",      lessonId);
        fd.append("watchedSeconds", String(watchedSeconds));
        fd.append("completed",      completed ? "true" : "false");
        navigator.sendBeacon("/api/courses/progress", fd);
        isSavingRef.current = false;
        return;
      }

      fetcher.submit(
        {
          lessonId,
          watchedSeconds: String(watchedSeconds),
          completed:      completed ? "true" : "false",
        },
        { method: "POST", action: "/api/courses/progress" }
      );

      setTimeout(() => { isSavingRef.current = false; }, 300);
    },
    [lessonId, fetcher]
  );

  // ── v3 event: onTimeUpdate (replaces v2 onProgress) ─────────────────────
  const handleTimeUpdate = () => {
    const player = playerRef.current;
    if (!player || seeking || !player.duration) return;

    const { currentTime, duration } = player;
    playedSecondsRef.current = currentTime;

    if (duration > 0) setPlayed(currentTime / duration);

    onProgress(lessonId, Math.round(currentTime));

    // Auto-complete at threshold
    if (
      !completedRef.current &&
      duration > 0 &&
      currentTime / duration >= COMPLETE_THRESHOLD
    ) {
      completedRef.current = true;
      setShowCompletedBadge(true);
      saveProgress(currentTime, true);
      onComplete(lessonId, Math.round(currentTime));
      return;
    }

    saveProgress(currentTime, false);
  };

  // ── v3 event: onProgress (buffering info, not playback time) ────────────
  // In v3 this fires when buffered ranges change — we use it for the loaded bar
  const [loaded, setLoaded] = useState(0);
  const handleProgress = () => {
    const player = playerRef.current;
    if (!player || !player.buffered?.length || !player.duration) return;
    setLoaded(player.buffered.end(player.buffered.length - 1) / player.duration);
  };

  const handleEnded = () => {
    if (!completedRef.current) {
      completedRef.current = true;
      setShowCompletedBadge(true);
      saveProgress(durationRef.current, true);
      onComplete(lessonId, Math.round(durationRef.current));
    }
  };

  const handlePause = () => {
    saveProgress(playedSecondsRef.current, completedRef.current);
  };

  // Seek bar handlers (following the sample App.tsx pattern exactly)
  const handleSeekMouseDown = () => setSeeking(true);

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayed(parseFloat(e.target.value));
  };

  const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    setSeeking(false);
    const player = playerRef.current;
    if (!player) return;
    player.currentTime = parseFloat((e.target as HTMLInputElement).value) * player.duration;
  };

  // ── Save on tab close / navigation ──────────────────────────────────────
  useEffect(() => {
    const handle = () =>
      saveProgress(playedSecondsRef.current, completedRef.current, true);
    window.addEventListener("beforeunload", handle);
    return () => window.removeEventListener("beforeunload", handle);
  }, [saveProgress]);

  const defaultYouTubeConfig = {
    youtube: {
      color:           "white" as const,
      playerVars: {
        modestbranding: 1,
        rel:            0,
        iv_load_policy: 3,
      },
    },
  } as const;

  const mergedConfig = playerConfig
    ? { ...defaultYouTubeConfig, ...playerConfig }
    : defaultYouTubeConfig;

  return (
    <div className={`relative w-full aspect-video overflow-hidden rounded-xl bg-black ${className ?? ""}`}>
      {/* ── ReactPlayer v3 ── */}
      <ReactPlayer
        ref={setPlayerRef}          // ✅ v3 callback ref pattern
        src={url}                   // ✅ v3: `src` not `url`
        width="100%"
        height="100%"
        playing={playing}
        controls={controls}
        light={light}
        config={mergedConfig}
        onStart={()       => setHasStarted(true)}
        onPlay={()        => setHasStarted(true)}
        onPause={handlePause}
        onEnded={handleEnded}
        onTimeUpdate={handleTimeUpdate}   // ✅ v3 name (was onProgress in v2)
        onProgress={handleProgress}       // ✅ v3: buffer info only
        onDurationChange={handleDurationChange} // ✅ v3 name (was onDuration in v2)
        onSeeking={()     => setSeeking(true)}
        onSeeked={()      => setSeeking(false)}
        onError={(e)      => console.error("[MediaPlayer] error", e)}
      />

      {/* ── Completed badge ── */}
      {showCompletedBadge && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-green-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
          <CheckCircle2 size={12} /> Completed
        </div>
      )}

      {/* ── Resume badge ── */}
      {!hasStarted && initialWatched > 30 && !isCompleted && (
        <div className="absolute bottom-12 left-4 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
          ▶ Resume from{" "}
          <Duration seconds={initialWatched} className="inline" />
        </div>
      )}

      {/* ── Custom seek + buffer bar (shown only when controls=false) ── */}
      {!controls && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-2 space-y-1">
          {/* Buffer bar */}
          <div className="relative h-1 w-full rounded-full bg-white/20">
            <div
              className="absolute h-full rounded-full bg-white/40"
              style={{ width: `${loaded * 100}%` }}
            />
            <div
              className="absolute h-full rounded-full bg-purple-500"
              style={{ width: `${played * 100}%` }}
            />
          </div>
          {/* Seek input overlaid on top */}
          <input
            type="range"
            min={0}
            max={0.999999}
            step="any"
            value={played}
            onMouseDown={handleSeekMouseDown}
            onChange={handleSeekChange}
            onMouseUp={handleSeekMouseUp}
            className="absolute bottom-3 left-3 right-3 w-[calc(100%-1.5rem)] cursor-pointer opacity-0 h-4"
            aria-label="Seek"
          />
          {/* Time display */}
          <div className="flex justify-between text-[10px] text-white/70">
            <Duration seconds={playedSecondsRef.current} />
            <Duration seconds={durationRef.current} />
          </div>
        </div>
      )}
    </div>
  );
});