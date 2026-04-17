'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchQuestionSpeech } from '@/lib/api';

export interface UseSpeakResult {
  supported: boolean;
  speaking: boolean;
  loading: boolean;
  /** Toggle playback — MUST be called directly from onClick/onTouch. */
  toggle: (interviewId: string, questionId: string, text: string) => void;
  /** Hard-stop anything that's playing (can be called from anywhere). */
  cancel: () => void;
}

/**
 * Simple, reliable speech for the interview page.
 *
 * Strategy:
 * 1. If NOT currently speaking, fire browser speechSynthesis SYNCHRONOUSLY
 *    (works on desktop + iOS as long as called from onClick).
 * 2. In parallel, try to fetch a higher-quality MP3 from the backend
 *    (OpenAI TTS). If that succeeds before speechSynthesis finishes we
 *    silently swap in the MP3. If it fails (404/503/etc.) we just keep
 *    the speechSynthesis audio — user never sees an error.
 * 3. If already speaking, a tap stops playback. Next tap plays again.
 */
export function useSpeak(): UseSpeakResult {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef<Map<string, string>>(new Map());
  const backendUpRef = useRef<boolean | null>(null); // null=unknown, true/false=known
  const synthFiredRef = useRef(false);

  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);

  const supported = typeof window !== 'undefined';

  useEffect(() => {
    return () => {
      cacheRef.current.forEach((url) => URL.revokeObjectURL(url));
      cacheRef.current.clear();
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
    };
  }, []);

  const ensureAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.onplay = () => setSpeaking(true);
      audioRef.current.onpause = () => setSpeaking(false);
      audioRef.current.onended = () => setSpeaking(false);
    }
    return audioRef.current;
  };

  const stopAll = () => {
    try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setSpeaking(false);
    synthFiredRef.current = false;
  };

  const fireBrowserSpeech = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.0;
      u.pitch = 1.0;
      u.volume = 1.0;
      u.onstart = () => setSpeaking(true);
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false); // interrupted/cancelled is fine
      window.speechSynthesis.speak(u);
      synthFiredRef.current = true;
    } catch { /* noop */ }
  };

  const playMp3 = (url: string) => {
    // Swap from any in-progress browser TTS to the higher-quality MP3.
    try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
    synthFiredRef.current = false;
    const el = ensureAudio();
    el.src = url;
    const p = el.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => { /* if audio can't play, browser speech is already going */ });
    }
  };

  const toggle = useCallback((interviewId: string, questionId: string, text: string) => {
    if (!supported) return;

    // Already speaking → stop.
    if (speaking) { stopAll(); return; }

    // Cached MP3 → play directly.
    const cached = cacheRef.current.get(questionId);
    if (cached) { playMp3(cached); return; }

    // Start browser speech immediately so the user hears SOMETHING right now.
    fireBrowserSpeech(text);

    // If we've previously learned the backend TTS endpoint is missing, stop here.
    if (backendUpRef.current === false) return;

    // Try backend for better voice. If it loads fast, we swap in the MP3.
    ensureAudio();
    setLoading(true);
    fetchQuestionSpeech(interviewId, questionId)
      .then((blob) => {
        backendUpRef.current = true;
        const objectUrl = URL.createObjectURL(blob);
        cacheRef.current.set(questionId, objectUrl);
        // Only swap if the user hasn't already stopped in the meantime.
        if (synthFiredRef.current || speaking) playMp3(objectUrl);
      })
      .catch(() => {
        // Backend unreachable (404 before deploy, 503 no key, network) —
        // silently rely on browser TTS we already started. Remember.
        backendUpRef.current = false;
      })
      .finally(() => setLoading(false));
  }, [supported, speaking]);

  const cancel = useCallback(() => { stopAll(); }, []);

  return { supported, speaking, loading, toggle, cancel };
}
