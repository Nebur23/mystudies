import { useCallback, useRef } from "react";

/**
 * Generates a tiny click sound using the Web Audio API.
 * No external file needed — synthesized in <1ms.
 */
export function useClickSound(volume = 0.03) {
  const ctxRef = useRef<AudioContext | null>(null);

  return useCallback(() => {
    try {
      if (!ctxRef.current) {
        ctxRef.current = new AudioContext();
      }
      const ctx    = ctxRef.current;
      const osc    = ctx.createOscillator();
      const gain   = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      // Short ~8ms click transient
      osc.type      = "sine";
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.008);

      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // AudioContext blocked — silently skip
    }
  }, [volume]);
}