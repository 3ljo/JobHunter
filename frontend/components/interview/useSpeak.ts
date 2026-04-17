'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchQuestionSpeech } from '@/lib/api';

export interface UseSpeakResult {
  supported: boolean;
  speaking: boolean;
  loading: boolean;
  error: string | null;
  /** Fetches MP3 from backend TTS and plays it via <audio>.
   *  Falls back to browser speechSynthesis if the backend endpoint is
   *  unavailable (e.g. 404/503 during deploy or missing OPENAI_API_KEY). */
  play: (interviewId: string, questionId: string, text: string) => void;
  cancel: () => void;
}

export function useSpeak(): UseSpeakResult {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef<Map<string, string>>(new Map());
  const backendFailedRef = useRef(false); // once we know backend TTS is down, skip it

  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supported = typeof window !== 'undefined';

  useEffect(() => {
    return () => {
      cacheRef.current.forEach((url) => URL.revokeObjectURL(url));
      cacheRef.current.clear();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
    };
  }, []);

  const ensureAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.onplay = () => setSpeaking(true);
      audioRef.current.onpause = () => setSpeaking(false);
      audioRef.current.onended = () => setSpeaking(false);
      audioRef.current.onerror = () => {
        setSpeaking(false);
        setError('Audio playback failed');
      };
    }
    return audioRef.current;
  };

  const playUrl = (url: string) => {
    const el = ensureAudio();
    el.src = url;
    const p = el.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        setSpeaking(false);
        setError('Tap the button again to play');
      });
    }
  };

  // Fallback: browser speechSynthesis. Works on desktop Chrome reliably and
  // on iOS when called from a real tap handler.
  const speakViaBrowser = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setError('Voice is not available in this browser');
      return;
    }
    try { window.speechSynthesis.cancel(); } catch { /* noop */ }
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.0;
      u.pitch = 1.0;
      u.volume = 1.0;
      u.onstart = () => setSpeaking(true);
      u.onend = () => setSpeaking(false);
      u.onerror = (ev) => {
        const reason = (ev as SpeechSynthesisErrorEvent).error;
        if (reason !== 'interrupted' && reason !== 'canceled') setError(reason);
        setSpeaking(false);
      };
      window.speechSynthesis.speak(u);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Voice playback failed');
    }
  };

  const play = useCallback((interviewId: string, questionId: string, text: string) => {
    if (!supported) return;
    setError(null);

    // Cached URL? Play immediately.
    const cached = cacheRef.current.get(questionId);
    if (cached) {
      playUrl(cached);
      return;
    }

    // If we already learned backend TTS is unavailable, skip straight to the
    // browser fallback so the user gets SOMETHING.
    if (backendFailedRef.current) {
      speakViaBrowser(text);
      return;
    }

    // Pre-create the audio element synchronously inside the gesture so iOS
    // keeps the gesture binding across the upcoming fetch.
    ensureAudio();

    setLoading(true);
    fetchQuestionSpeech(interviewId, questionId)
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        cacheRef.current.set(questionId, objectUrl);
        playUrl(objectUrl);
      })
      .catch((err: unknown) => {
        const e = err as { response?: { status?: number; data?: { error?: string } }; message?: string };
        const status = e.response?.status;
        // 404 (route missing / deploy in flight) or 503 (no API key) → fallback.
        if (status === 404 || status === 503) {
          backendFailedRef.current = true;
          speakViaBrowser(text);
          return;
        }
        setError(e.response?.data?.error || e.message || 'Failed to load voice');
      })
      .finally(() => setLoading(false));
  }, [supported]);

  const cancel = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
    setSpeaking(false);
  }, []);

  return { supported, speaking, loading, error, play, cancel };
}
