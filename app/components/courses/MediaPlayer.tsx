import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import ReactPlayer from "react-player";
import {
  Play, Pause, Volume2, VolumeX, Maximize,
  CheckCircle2, RotateCcw,
} from "lucide-react";
import Duration from "./Duration";

interface MediaPlayerProps {
  url: string;
  lessonId: string;
  initialWatched: number;
  isCompleted: boolean;
  onComplete: (lessonId: string, watchedSeconds: number) => void;
  onProgress: (lessonId: string, watchedSeconds: number) => void;
  playerConfig?: Record<string, unknown>;
  light?: boolean | string;
  className?: string;
}

const SAVE_INTERVAL_MS = 15_000;
const COMPLETE_THRESHOLD = 0.92;
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export const MediaPlayer = memo(function MediaPlayer({
  url,
  lessonId,
  initialWatched,
  isCompleted,
  onComplete,
  onProgress,
  playerConfig,
  light = false,
  className,
}: MediaPlayerProps) {
  const fetcher = useFetcher();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // ── v3: raw element ref via callback ──────────────────────────────────────
  const playerRef = useRef<HTMLVideoElement | null>(null);
  const durationRef = useRef<number>(0);
  const playedSecRef = useRef<number>(initialWatched);
  const completedRef = useRef<boolean>(isCompleted);
  const lastSaveRef = useRef<number>(0);
  const isSavingRef = useRef<boolean>(false);
  const seekedRef = useRef<boolean>(false);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Playback state (mirrors the sample App.tsx pattern exactly) ───────────
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [played, setPlayed] = useState(0);       // 0–1 fraction
  const [loaded, setLoaded] = useState(0);       // 0–1 fraction
  const [duration, setDuration] = useState(0);       // seconds
  const [seeking, setSeeking] = useState(false);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [hasStarted, setHasStarted] = useState(false);
  const [showCompletedBadge, setShowCompletedBadge] = useState(isCompleted);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // ── Ref callback (v3 pattern from sample) ─────────────────────────────────
  const setPlayerRef = useCallback((el: HTMLVideoElement) => {
    if (!el) return;
    playerRef.current = el;
  }, []);

  // ── Auto-hide controls after 3s of inactivity ────────────────────────────
  const showControls = () => {
    setControlsVisible(true);
    clearTimeout(controlsTimer.current ?? undefined);
    if (playing) {
      controlsTimer.current = setTimeout(() => setControlsVisible(false), 3000);
    }
  };

  useEffect(() => () => clearTimeout(controlsTimer.current ?? undefined), []);

  // ── Progress save ─────────────────────────────────────────────────────────
  const saveProgress = useCallback(
    (seconds: number, completed: boolean, force = false) => {
      if (isSavingRef.current) return;
      const now = Date.now();
      if (!force && !completed && now - lastSaveRef.current < SAVE_INTERVAL_MS) return;
      lastSaveRef.current = now;
      isSavingRef.current = true;
      const watchedSeconds = Math.round(seconds);

      if (force && typeof navigator !== "undefined" && navigator.sendBeacon) {
        const fd = new FormData();
        fd.append("lessonId", lessonId);
        fd.append("watchedSeconds", String(watchedSeconds));
        fd.append("completed", completed ? "true" : "false");
        navigator.sendBeacon("/api/courses/progress", fd);
        isSavingRef.current = false;
        return;
      }

      fetcher.submit(
        { lessonId, watchedSeconds: String(watchedSeconds), completed: completed ? "true" : "false" },
        { method: "POST", action: "/api/courses/progress" }
      );
      setTimeout(() => { isSavingRef.current = false; }, 300);
    },
    [lessonId, fetcher]
  );

  // ── v3 events (names from sample App.tsx) ────────────────────────────────

  // onDurationChange — fires when duration is first known; also handles resume seek
  const handleDurationChange = () => {
    const player = playerRef.current;
    if (!player) return;
    durationRef.current = player.duration;
    setDuration(player.duration);

    if (!seekedRef.current && initialWatched > 10) {
      seekedRef.current = true;
      player.currentTime = initialWatched;
    }
  };

  // onTimeUpdate — playback position, replaces v2's onProgress({playedSeconds})
  const handleTimeUpdate = () => {
    const player = playerRef.current;
    if (!player || seeking || !player.duration) return;

    const { currentTime, duration: dur } = player;
    playedSecRef.current = currentTime;

    setPlayed(currentTime / dur);
    onProgress(lessonId, Math.round(currentTime));

    // Auto-complete
    if (!completedRef.current && dur > 0 && currentTime / dur >= COMPLETE_THRESHOLD) {
      completedRef.current = true;
      setShowCompletedBadge(true);
      saveProgress(currentTime, true);
      onComplete(lessonId, Math.round(currentTime));
      return;
    }

    saveProgress(currentTime, false);
  };

  // onProgress — buffer info only in v3
  const handleProgress = () => {
    const player = playerRef.current;
    if (!player || !player.buffered?.length || !player.duration) return;
    setLoaded(player.buffered.end(player.buffered.length - 1) / player.duration);
  };

  const handleEnded = () => {
    setPlaying(false);
    if (!completedRef.current) {
      completedRef.current = true;
      setShowCompletedBadge(true);
      saveProgress(durationRef.current, true);
      onComplete(lessonId, Math.round(durationRef.current));
    }
  };

  // ── Controls ──────────────────────────────────────────────────────────────

  // ✅ Play/pause: toggle the playing state — ReactPlayer reads it reactively
  const handlePlayPause = () => {
    if (!hasStarted) setHasStarted(true);
    setPlaying(p => !p);
  };

  // ✅ onPause fires when the *player* pauses (including external causes)
  //    — sync React state and save progress
  const handlePause = () => {
    setPlaying(false);
    saveProgress(playedSecRef.current, completedRef.current);
  };

  const handlePlay = () => setPlaying(true);

  // ✅ Seek — matches sample exactly
  const handleSeekMouseDown = () => setSeeking(true);

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayed(parseFloat(e.target.value));
  };

  const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    setSeeking(false);
    const player = playerRef.current;
    if (!player) return;
    // Set actual video time
    player.currentTime = parseFloat((e.target as HTMLInputElement).value) * player.duration;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    setMuted(v === 0);
    const player = playerRef.current;
    if (player) player.volume = v;
  };

  const handleToggleMute = () => {
    setMuted(m => !m);
    const player = playerRef.current;
    if (player) player.muted = !muted;
  };

  const handleSetPlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    const player = playerRef.current;
    if (player) player.playbackRate = rate;
    setShowSpeedMenu(false);
  };

  const handleFullscreen = () => {
    if (wrapperRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        wrapperRef.current.requestFullscreen();
      }
    }
  };

  // ── Save on tab close ─────────────────────────────────────────────────────
  useEffect(() => {
    const handle = () => saveProgress(playedSecRef.current, completedRef.current, true);
    window.addEventListener("beforeunload", handle);
    return () => window.removeEventListener("beforeunload", handle);
  }, [saveProgress]);

  // 2. ✅ defaultConfig — type color as const literal, not string
  const defaultConfig = {
    youtube: {
      color: "white" as const,   // ← "white" | "red" | undefined, not string
      playerVars: { modestbranding: 1, rel: 0, iv_load_policy: 3 },
    },
  } satisfies Record<string, unknown>;

  return (
    <div
      ref={wrapperRef}
      onMouseMove={showControls}
      onMouseEnter={showControls}
      onMouseLeave={() => playing && setControlsVisible(false)}
      className={`group relative w-full aspect-video bg-black overflow-hidden rounded-xl select-none ${className ?? ""}`}
      style={{ cursor: controlsVisible ? "default" : "none" }}
    >
      {/* ── ReactPlayer ── */}
      <ReactPlayer
        ref={setPlayerRef}
        src={url}
        width="100%"
        height="100%"
        playing={playing}           // ✅ driven by state, not by events
        controls={false}            // ✅ we draw our own
        volume={volume}
        muted={muted}
        playbackRate={playbackRate}
        light={light}
        config={{ ...defaultConfig, ...playerConfig }}
        onStart={() => { setHasStarted(true); setPlaying(true); }}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onTimeUpdate={handleTimeUpdate}
        onProgress={handleProgress}
        onDurationChange={handleDurationChange}
        onSeeking={() => setSeeking(true)}
        onSeeked={() => setSeeking(false)}
        onRateChange={() => {
          const player = playerRef.current;
          if (player) setPlaybackRate(player.playbackRate);
        }}
        onError={e => console.error("[MediaPlayer]", e)}
      />

      {/* ── Click overlay: play/pause on click ── */}
      <div
        className="absolute inset-0 z-10"
        onClick={handlePlayPause}
      />

      {/* ── Centre play icon (shown when paused + controls visible) ── */}
      {!playing && controlsVisible && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <Play size={28} className="text-white fill-white ml-1" />
          </div>
        </div>
      )}

      {/* ── Completed badge ── */}
      {showCompletedBadge && (
        <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
          <CheckCircle2 size={12} /> Completed
        </div>
      )}

      {/* ── Resume badge ── */}
      {!hasStarted && initialWatched > 30 && !isCompleted && (
        <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white backdrop-blur-sm border border-white/10">
          <RotateCcw size={11} /> Resume from <Duration seconds={initialWatched} className="inline font-mono" />
        </div>
      )}

      {/* ── Controls bar ── */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-20 transition-opacity duration-300 ${controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        onClick={e => e.stopPropagation()} // don't bubble to play/pause overlay
      >
        {/* Gradient scrim */}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent pointer-events-none rounded-b-xl" />

        <div className="relative px-4 pb-3 pt-8 space-y-2">
          {/* ── Progress / seek ── */}
          <div className="relative h-5 flex items-center group/seek">
            {/* Buffer track */}
            <div className="absolute inset-y-0 my-auto h-1 w-full rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-white/30 transition-[width]"
                style={{ width: `${loaded * 100}%` }}
              />
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-indigo-400 transition-[width]"
                style={{ width: `${played * 100}%` }}
              />
            </div>

            {/* ✅ Invisible range input sits over the track — handles all seek interaction */}
            <input
              type="range"
              min={0}
              max={0.999999}
              step="any"
              value={played}
              onMouseDown={handleSeekMouseDown}
              onChange={handleSeekChange}
              onMouseUp={handleSeekMouseUp}
              className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
              aria-label="Seek"
            />

            {/* Thumb dot */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md pointer-events-none opacity-0 group-hover/seek:opacity-100 transition-opacity"
              style={{ left: `calc(${played * 100}% - 6px)` }}
            />
          </div>

          {/* ── Bottom row ── */}
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={handlePlayPause}
              className="text-white hover:text-indigo-300 transition-colors p-1"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing
                ? <Pause size={18} className="fill-current" />
                : <Play size={18} className="fill-current" />
              }
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1.5 group/vol">
              <button
                onClick={handleToggleMute}
                className="text-white hover:text-indigo-300 transition-colors p-1"
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted || volume === 0
                  ? <VolumeX size={16} />
                  : <Volume2 size={16} />
                }
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/vol:w-16 overflow-hidden transition-[width] duration-200 cursor-pointer accent-indigo-400"
                aria-label="Volume"
              />
            </div>

            {/* Time */}
            <div className="text-white/70 text-xs font-mono tabular-nums flex items-center gap-1">
              <Duration seconds={played * duration} />
              <span className="text-white/40">/</span>
              <Duration seconds={duration} />
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Speed */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(s => !s)}
                className="text-white/70 hover:text-white text-xs font-mono px-2 py-1 rounded hover:bg-white/10 transition-colors"
              >
                {playbackRate}×
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-zinc-900 border border-white/10 rounded-lg overflow-hidden shadow-xl">
                  {SPEEDS.map(s => (
                    <button
                      key={s}
                      onClick={() => handleSetPlaybackRate(s)}
                      className={`block w-full px-4 py-1.5 text-xs text-left transition-colors ${playbackRate === s
                        ? "bg-indigo-600 text-white"
                        : "text-white/70 hover:bg-white/10"
                        }`}
                    >
                      {s}×
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button
              onClick={handleFullscreen}
              className="text-white/70 hover:text-white transition-colors p-1"
              aria-label="Fullscreen"
            >
              <Maximize size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});