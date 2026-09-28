import { useCallback } from 'react';
import { useSettingsStore } from '../stores/settingsStore';

export function useSound() {
  const { settings } = useSettingsStore();

  const playTone = useCallback((freq: number, type: OscillatorType, duration: number, delay = 0) => {
    if (!settings.soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      setTimeout(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
      }, delay);
    } catch {}
  }, [settings.soundEnabled]);

  const playConnected = useCallback(() => {
    playTone(523.25, 'sine', 0.15, 0); // C5
    playTone(659.25, 'sine', 0.2, 120); // E5
  }, [playTone]);

  const playTransferComplete = useCallback(() => {
    playTone(523.25, 'sine', 0.1, 0);
    playTone(659.25, 'sine', 0.1, 80);
    playTone(783.99, 'sine', 0.25, 160); // G5
  }, [playTone]);

  const playNotify = useCallback(() => {
    playTone(880, 'sine', 0.15, 0); // A5
  }, [playTone]);

  return { playConnected, playTransferComplete, playNotify };
}
