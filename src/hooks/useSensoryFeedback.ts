import { useCallback, useRef } from "react";

export function useSensoryFeedback(enabled: boolean) {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }, []);

  const playBeep = useCallback(
    (type: "dot" | "dash") => {
      if (!enabled) return;
      const duration = type === "dot" ? 0.1 : 0.3;

      // Audio
      try {
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 1000;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
      } catch {
        // Web Audio not supported
      }

      // Haptics
      try {
        navigator.vibrate?.(type === "dot" ? 100 : 300);
      } catch {
        // Vibration not supported
      }
    },
    [enabled, getAudioCtx]
  );

  return { playBeep };
}
