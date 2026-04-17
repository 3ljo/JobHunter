'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseSpeakResult {
  supported: boolean;
  speaking: boolean;
  primed: boolean;      // true after the first successful (or warmup) speak
  speak: (text: string) => Promise<void>;
  prime: () => void;    // call this inside a user gesture (e.g. button onClick)
  cancel: () => void;
}

/**
 * Robust wrapper around window.speechSynthesis.
 *
 * iOS Safari requires that speechSynthesis.speak() be initiated from a user
 * gesture (click/tap). If called from a useEffect or timer it silently
 * does nothing. We expose prime() so callers can "unlock" the engine from
 * a real click handler; after that, subsequent speak() calls work normally.
 *
 * iOS also cuts off speech after ~15s of continuous speaking unless you
 * pause/resume periodically, hence the keepalive interval.
 */
export function useSpeak(): UseSpeakResult {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [primed, setPrimed] = useState(false);
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

  const startKeepAlive = useCallback(() => {
    if (keepAliveRef.current) return;
    keepAliveRef.current = setInterval(() => {
      const s = window.speechSynthesis;
      if (s.speaking) {
        // iOS Safari cuts off around 15s; pause/resume keeps it flowing.
        s.pause();
        s.resume();
      }
    }, 10000);
  }, []);

  const stopKeepAlive = useCallback(() => {
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
  }, []);

  const speakImpl = useCallback(
    (text: string) =>
      new Promise<void>((resolve) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text.trim()) {
          resolve();
          return;
        }
        try { window.speechSynthesis.cancel(); } catch { /* noop */ }

        // Small delay so cancel() has flushed the queue on iOS before the
        // next speak() call (race condition that silently drops audio).
        setTimeout(() => {
          try {
            const utterance = new SpeechSynthesisUtterance(text);
            if (voiceRef.current) utterance.voice = voiceRef.current;
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            utterance.onstart = () => {
              setSpeaking(true);
              setPrimed(true);
              startKeepAlive();
            };
            utterance.onend = () => {
              setSpeaking(false);
              stopKeepAlive();
              resolve();
            };
            utterance.onerror = (ev) => {
              // Log so the issue is visible during dev, but don't break UX.
              // eslint-disable-next-line no-console
              console.warn('speechSynthesis error:', (ev as SpeechSynthesisErrorEvent).error);
              setSpeaking(false);
              stopKeepAlive();
              resolve();
            };
            window.speechSynthesis.speak(utterance);
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('speechSynthesis.speak threw:', err);
            resolve();
          }
        }, 40);
      }),
    [startKeepAlive, stopKeepAlive]
  );

  const prime = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (primed) return;
    try {
      const warmup = new SpeechSynthesisUtterance(' ');
      warmup.volume = 0;
      warmup.rate = 10;
      warmup.onend = () => setPrimed(true);
      warmup.onerror = () => setPrimed(true);
      window.speechSynthesis.speak(warmup);
    } catch {
      // If warmup fails, still flag primed so we don't block later calls.
      setPrimed(true);
    }
  }, [primed]);

  const cancel = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try { window.speechSynthesis.cancel(); } catch { /* noop */ }
    setSpeaking(false);
    stopKeepAlive();
  }, [stopKeepAlive]);

  return { supported, speaking, primed, speak: speakImpl, prime, cancel };
}
