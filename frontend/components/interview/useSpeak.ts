'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseSpeakResult {
  supported: boolean;
  speaking: boolean;
  speak: (text: string) => void;   // MUST be called inside a user gesture (click/tap)
  cancel: () => void;
}

/**
 * Minimal wrapper around window.speechSynthesis optimized for iOS Safari.
 *
 * iOS rules we obey:
 * 1. speak() must fire synchronously inside a user-gesture handler. We do NO
 *    setTimeout, no awaits, no cancel-before-speak. The caller calls us
 *    directly from onClick / onTouch.
 * 2. Overlapping speak() calls cause "interrupted" errors and drop audio on
 *    iOS — so we bail out if already speaking (the user can tap Stop first).
 * 3. Long utterances get cut off around 15s — we pause/resume periodically.
 */
export function useSpeak(): UseSpeakResult {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSupported(false);
      return;
    }
    setSupported(true);

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;
      const priority = [
        /Google US English/i,
        /Samantha/i,
        /Microsoft.*Aria/i,
        /Microsoft.*Jenny/i,
        /en[-_]US/i,
        /en[-_]GB/i,
        /^en/i,
      ];
      for (const pattern of priority) {
        const match = voices.find((v) => pattern.test(v.name) || pattern.test(v.lang));
        if (match) { voiceRef.current = match; return; }
      }
      voiceRef.current = voices[0] || null;
    };

    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      if (keepAliveRef.current) clearInterval(keepAliveRef.current);
    };
  }, []);

  const startKeepAlive = () => {
    if (keepAliveRef.current) return;
    keepAliveRef.current = setInterval(() => {
      const s = window.speechSynthesis;
      if (s.speaking) { s.pause(); s.resume(); }
    }, 10000);
  };
  const stopKeepAlive = () => {
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
  };

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (!text || !text.trim()) return;

    const synth = window.speechSynthesis;

    // If already speaking, cancel first. On iOS we then fire speak() in the
    // SAME synchronous turn to preserve the user-gesture chain.
    if (synth.speaking || synth.pending) {
      try { synth.cancel(); } catch { /* noop */ }
    }

    try {
      const u = new SpeechSynthesisUtterance(text);
      if (voiceRef.current) u.voice = voiceRef.current;
      u.rate = 1.0;
      u.pitch = 1.0;
      u.volume = 1.0;
      u.onstart = () => { setSpeaking(true); startKeepAlive(); };
      u.onend = () => { setSpeaking(false); stopKeepAlive(); };
      u.onerror = (ev) => {
        // "interrupted" is benign (we cancelled to start a new one). Ignore.
        const reason = (ev as SpeechSynthesisErrorEvent).error;
        if (reason !== 'interrupted' && reason !== 'canceled') {
          // eslint-disable-next-line no-console
          console.warn('speechSynthesis error:', reason);
        }
        setSpeaking(false);
        stopKeepAlive();
      };
      synth.speak(u);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('speechSynthesis.speak threw:', err);
    }
  }, []);

  const cancel = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try { window.speechSynthesis.cancel(); } catch { /* noop */ }
    setSpeaking(false);
    stopKeepAlive();
  }, []);

  return { supported, speaking, speak, cancel };
}
