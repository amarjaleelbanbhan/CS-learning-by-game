'use client';

import { useCallback, useState } from 'react';

/**
 * Tiny synthesized SFX engine (Web Audio oscillators — no audio asset files).
 * "Sound-ready architecture": every meaningful game event has a distinct,
 * generated tone. Mute state persists across sessions; the AudioContext is
 * created lazily on first user gesture (required by browser autoplay policy).
 */
export type SfxKind = 'click' | 'success' | 'error' | 'levelup' | 'reward' | 'boot';

let ctx: AudioContext | null = null;
let muted = false;

if (typeof window !== 'undefined') {
  muted = window.localStorage.getItem('arc-reactor-muted') === '1';
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('arc-reactor-muted', value ? '1' : '0');
  }
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

interface Tone {
  freq: number;
  duration: number;
  type: OscillatorType;
  delay?: number;
  gain?: number;
}

/** Each kind is a tiny melodic gesture (1-3 tones), tuned to feel sci-fi. */
const RECIPES: Record<SfxKind, Tone[]> = {
  click: [{ freq: 720, duration: 0.04, type: 'sine', gain: 0.05 }],
  success: [
    { freq: 660, duration: 0.09, type: 'triangle', gain: 0.08 },
    { freq: 990, duration: 0.12, type: 'triangle', delay: 0.08, gain: 0.08 },
  ],
  error: [
    { freq: 220, duration: 0.16, type: 'sawtooth', gain: 0.05 },
    { freq: 160, duration: 0.18, type: 'sawtooth', delay: 0.1, gain: 0.05 },
  ],
  levelup: [
    { freq: 523, duration: 0.1, type: 'triangle', gain: 0.08 },
    { freq: 659, duration: 0.1, type: 'triangle', delay: 0.1, gain: 0.08 },
    { freq: 988, duration: 0.22, type: 'triangle', delay: 0.2, gain: 0.09 },
  ],
  reward: [
    { freq: 440, duration: 0.08, type: 'sine', gain: 0.07 },
    { freq: 660, duration: 0.08, type: 'sine', delay: 0.07, gain: 0.07 },
    { freq: 880, duration: 0.18, type: 'sine', delay: 0.14, gain: 0.08 },
  ],
  boot: [
    { freq: 90, duration: 0.6, type: 'sine', gain: 0.06 },
    { freq: 180, duration: 0.4, type: 'sine', delay: 0.15, gain: 0.04 },
  ],
};

export function playSfx(kind: SfxKind): void {
  if (muted) return;
  const audio = getCtx();
  if (!audio) return;

  for (const tone of RECIPES[kind]) {
    const osc = audio.createOscillator();
    const gainNode = audio.createGain();
    osc.type = tone.type;
    osc.frequency.value = tone.freq;

    const start = audio.currentTime + (tone.delay ?? 0);
    const peak = tone.gain ?? 0.06;
    gainNode.gain.setValueAtTime(0, start);
    gainNode.gain.linearRampToValueAtTime(peak, start + 0.012);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, start + tone.duration);

    osc.connect(gainNode);
    gainNode.connect(audio.destination);
    osc.start(start);
    osc.stop(start + tone.duration + 0.02);
  }
}

/** React binding for a mute toggle (e.g. in the HUD). */
export function useSoundMuted(): [boolean, () => void] {
  const [value, setValue] = useState(muted);
  const toggle = useCallback(() => {
    setMuted(!muted);
    setValue(!muted);
  }, []);
  return [value, toggle];
}
