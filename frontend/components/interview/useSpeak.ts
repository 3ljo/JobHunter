'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseSpeakResult {
  supported: boolean;
  speaking: boolean;
  speak: (text: string) => Promise<void>;
  cancel: () => void;
}

/**
 * Thin wrapper around window.speechSynthesis.
 * Prefers a natural-sounding English voice when available.
 */
export function useSpeak(): UseSpeakResult {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSupported(false);
      return;
    }
    setSupported(true);

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;
      // Priority: natural US voices, then any English, then first available
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
    };
  }, []);

  const speak = useCallback((text: string) => {
    return new Promise<void>((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text.trim()) {
        resolve();
        return;
      }
      try { window.speechSynthesis.cancel(); } catch { /* noop */ }
      const utterance = new SpeechSynthesisUtterance(text);
      if (voiceRef.current) utterance.voice = voiceRef.current;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => { setSpeaking(false); resolve(); };
      utterance.onerror = () => { setSpeaking(false); resolve(); };
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const cancel = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try { window.speechSynthesis.cancel(); } catch { /* noop */ }
    setSpeaking(false);
  }, []);

  return { supported, speaking, speak, cancel };
}
