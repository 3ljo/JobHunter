'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchQuestionSpeech } from '@/lib/api';

export interface UseSpeakResult {
  supported: boolean;
  speaking: boolean;
  loading: boolean;
  error: string | null;
  /** Plays a question's audio (fetches MP3 from backend TTS, then plays via <audio>). */
  play: (interviewId: string, questionId: string) => void;
  cancel: () => void;
}

/**
 * Remote-audio speech. Replaces the unreliable browser SpeechSynthesis
 * API with a backend TTS call that returns MP3, which we play via a
 * hidden <audio> element. Works identically on Chrome desktop, Chrome
 * Android, and iOS Safari.
 *
 * Important: `play()` MUST be called synchronously inside an onClick
 * handler. We create the Audio element + call .play() inside the same
 * call stack so iOS can attach the gesture to the playback.
 */
export function useSpeak(): UseSpeakResult {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentUrlRef = useRef<string | null>(null);
  const cacheRef = useRef<Map<string, string>>(new Map()); // questionId -> objectURL

  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Always "supported" — browsers all have <audio>. No SpeechSynthesis needed.
  const supported = typeof window !== 'undefined' && typeof Audio !== 'undefined';

  useEffect(() => {
    return () => {
      // Clean up object URLs on unmount
      cacheRef.current.forEach((url) => URL.revokeObjectURL(url));
      cacheRef.current.clear();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const revokeAndClear = (questionId: string) => {
    const url = cacheRef.current.get(questionId);
    if (url) {
      URL.revokeObjectURL(url);
      cacheRef.current.delete(questionId);
    }
  };

  const playUrl = useCallback((url: string) => {
    // Re-use the same Audio element so iOS recognizes the gesture binding.
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
    audioRef.current.src = url;
    currentUrlRef.current = url;
    const promise = audioRef.current.play();
    if (promise && typeof promise.catch === 'function') {
      promise.catch((err) => {
        // eslint-disable-next-line no-console
        console.warn('audio.play() rejected:', err);
        setSpeaking(false);
        setError('Tap the button again to start playback');
      });
    }
  }, []);

  const play = useCallback(
    (interviewId: string, questionId: string) => {
      if (!supported) return;
      setError(null);

      // If already speaking and same question, toggle off.
      if (speaking && currentUrlRef.current && cacheRef.current.get(questionId) === currentUrlRef.current) {
        audioRef.current?.pause();
        setSpeaking(false);
        return;
      }

      // Pre-cached? Play immediately (still inside user gesture).
      const cached = cacheRef.current.get(questionId);
      if (cached) {
        playUrl(cached);
        return;
      }

      // Not cached: we must fetch. The gesture-chain breaks across the await,
      // but modern browsers (including iOS 14.5+) allow HTMLAudioElement.play()
      // after a fetch IF the Audio element was created during the original
      // gesture. We pre-create the Audio element now to preserve that binding.
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

      setLoading(true);
      fetchQuestionSpeech(interviewId, questionId)
        .then((blob) => {
          const objectUrl = URL.createObjectURL(blob);
          cacheRef.current.set(questionId, objectUrl);
          playUrl(objectUrl);
        })
        .catch((err: unknown) => {
          const e = err as { response?: { data?: { error?: string } }; message?: string };
          const msg = e.response?.data?.error || e.message || 'Failed to load voice';
          setError(msg);
        })
        .finally(() => setLoading(false));
    },
    [supported, speaking, playUrl]
  );

  const cancel = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setSpeaking(false);
  }, []);

  // Expose a helper no longer strictly needed but kept for API parity if
  // someone else grabs this hook in the future.
  void revokeAndClear;

  return { supported, speaking, loading, error, play, cancel };
}
