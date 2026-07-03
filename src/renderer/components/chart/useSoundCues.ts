import { useCallback, useEffect, useRef, useState } from 'react';

export type SoundCue = 'open' | 'notify' | 'up' | 'down' | 'bar' | 'focus';

const FREQUENCIES: Record<SoundCue, [number, number]> = {
  open: [440, 660],
  notify: [660, 880],
  up: [523, 784],
  down: [392, 294],
  bar: [720, 720],
  focus: [520, 520],
};

export function useSoundCues(defaultEnabled = true) {
  const [enabled, setEnabled] = useState(defaultEnabled);
  const ctxRef = useRef<AudioContext | null>(null);

  const play = useCallback(
    (cue: SoundCue) => {
      if (!enabled) return;
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) return;
      const ctx = ctxRef.current ?? new AudioContextCtor();
      ctxRef.current = ctx;
      const now = ctx.currentTime;
      const [a, b] = FREQUENCIES[cue];
      [a, b].forEach((frequency, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = cue === 'down' ? 'triangle' : 'sine';
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, now + i * 0.055);
        gain.gain.exponentialRampToValueAtTime(0.04, now + i * 0.055 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.055 + 0.11);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.055);
        osc.stop(now + i * 0.055 + 0.13);
      });
    },
    [enabled],
  );

  useEffect(() => {
    const onFocus = (event: FocusEvent) => {
      if ((event.target as HTMLElement | null)?.tagName === 'INPUT') play('focus');
    };
    window.addEventListener('focusin', onFocus);
    return () => window.removeEventListener('focusin', onFocus);
  }, [play]);

  return { enabled, setEnabled, play };
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
