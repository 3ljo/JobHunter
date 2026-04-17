'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Minimal typings for the Web Speech API (not in lib.dom.d.ts everywhere).
interface ISpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: { transcript: string; confidence: number };
}
interface ISpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: {
    readonly length: number;
    [index: number]: ISpeechRecognitionResult;
  };
}
interface ISpeechRecognitionError extends Event {
  error: string;
  message?: string;
}
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((ev: ISpeechRecognitionEvent) => void) | null;
  onerror: ((ev: ISpeechRecognitionError) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  }
}

export interface UseVoiceRecognitionResult {
  supported: boolean;
  listening: boolean;
  transcript: string;          // finalized text only
  interim: string;             // latest in-flight fragment
  start: () => void;
  stop: () => void;
  reset: () => void;
  error: string | null;
}

export function useVoiceRecognition(): UseVoiceRecognitionResult {
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) {
      setSupported(false);
      return;
    }
    setSupported(true);
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event) => {
      let finalChunk = '';
      let interimChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript || '';
        if (result.isFinal) finalChunk += text + ' ';
        else interimChunk += text;
      }
      if (finalChunk) {
        setTranscript((prev) => (prev + ' ' + finalChunk).trim());
      }
      setInterim(interimChunk);
    };

    rec.onerror = (ev) => {
      // "no-speech" and "aborted" are harmless; don't surface them
      if (ev.error === 'no-speech' || ev.error === 'aborted') return;
      setError(ev.error === 'not-allowed'
        ? 'Microphone permission denied. Allow mic access in your browser settings.'
        : ev.message || ev.error || 'Voice recognition failed');
      setListening(false);
    };

    rec.onend = () => {
      setListening(false);
      setInterim('');
    };

    rec.onstart = () => {
      setListening(true);
      setError(null);
    };

    recognitionRef.current = rec;
    return () => {
      try { rec.abort(); } catch { /* noop */ }
      recognitionRef.current = null;
    };
  }, []);

  const start = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      setError(null);
      rec.start();
    } catch {
      // start() throws if already started; ignore
    }
  }, []);

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    try { rec.stop(); } catch { /* noop */ }
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setInterim('');
    setError(null);
  }, []);

  return { supported, listening, transcript, interim, start, stop, reset, error };
}
