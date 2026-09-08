/**
 * Module 1/2 — Voice Activity Detection (VAD)
 * A hiccup-free listening primitive for the voice listing assistant:
 *  - Live energy-based "listening / speaking" indicator via analyser node.
 *  - Speech segmentation: accumulates recognition finals and only emits a
 *    completed utterance after a quiet gap (silenceMs), never blocking the UI.
 *  - Auto-restarts the microphone on unexpected browser ends.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { SupportedLanguageCode } from '../../types';
import { SpeechService } from '../../lib/speech';

export interface UseVadOptions {
  language: SupportedLanguageCode;
  enabled: boolean;
  onUtterance: (text: string) => void;
  onInterim?: (text: string) => void;
  onListeningChange?: (listening: boolean) => void;
  silenceMs?: number;
}

export interface VoiceActivityController {
  listening: boolean;
  speaking: boolean;
  interim: string;
}

export function useVoiceActivityDetector(options: UseVadOptions): VoiceActivityController {
  const { language, enabled, onUtterance, onInterim, onListeningChange, silenceMs = 1900 } = options;

  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [interim, setInterim] = useState('');

  const enabledRef = useRef(enabled);
  const onUtteranceRef = useRef(onUtterance);
  const onInterimRef = useRef(onInterim);
  const onListeningChangeRef = useRef(onListeningChange);
  const silenceRef = useRef(silenceMs);

  const bufferRef = useRef('');
  const silenceTimerRef = useRef<number | null>(null);
  const restartingRef = useRef(false);
  const stopRequestedRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const analyserRafRef = useRef<number | null>(null);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);
  useEffect(() => {
    onUtteranceRef.current = onUtterance;
  }, [onUtterance]);
  useEffect(() => {
    onInterimRef.current = onInterim;
  }, [onInterim]);
  useEffect(() => {
    onListeningChangeRef.current = onListeningChange;
  }, [onListeningChange]);
  useEffect(() => {
    silenceRef.current = silenceMs;
  }, [silenceMs]);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current !== null) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  /** Energy-based speaking detection — keeps the orb/mic faithful to reality. */
  const attachAnalyser = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.55;
      source.connect(analyser);

      const buffer = new Float32Array(analyser.fftSize);
      const loop = () => {
        analyserRafRef.current = requestAnimationFrame(loop);
        if (!enabledRef.current) return;
        analyser.getFloatTimeDomainData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i += 1) {
          sum += buffer[i] * buffer[i];
        }
        const rms = Math.sqrt(sum / buffer.length);
        setSpeaking(rms > 0.012);
      };
      analyserRafRef.current = requestAnimationFrame(loop);
    } catch {
      // Mic energy is a cosmetic improvement; recognition still runs.
    }
  }, []);

  const stopAnalyser = useCallback(() => {
    if (analyserRafRef.current !== null) {
      cancelAnimationFrame(analyserRafRef.current);
      analyserRafRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
  }, []);

  /** Flushes the accumulated transcript to consumers after a silence gap. */
  const flushBuffer = useCallback(() => {
    clearSilenceTimer();
    const text = bufferRef.current.trim();
    bufferRef.current = '';
    if (text) {
      onUtteranceRef.current(text);
    }
  }, [clearSilenceTimer]);

  const restart = useCallback(() => {
    if (!enabledRef.current || stopRequestedRef.current || restartingRef.current) return;
    restartingRef.current = true;
    try {
      const started = SpeechService.startListening(language, {
        onResult: (text, isFinal) => {
          if (isFinal) {
            const normalized = text.replace(/\s+/g, ' ').trim();
            bufferRef.current = bufferRef.current ? `${bufferRef.current} ${normalized}` : normalized;
            setInterim('');

            // Any new speech resets the quiet-gap timer.
            clearSilenceTimer();
            silenceTimerRef.current = window.setTimeout(() => {
              flushBuffer();
            }, silenceRef.current);
          } else {
            setInterim(text);
            if (onInterimRef.current) onInterimRef.current(text);
          }
        },
        onError: (err) => {
          restartingRef.current = false;
          const permanentDenial = ['not-allowed', 'service-not-allowed', 'not-found'].includes(err);
          if (permanentDenial || !enabledRef.current || stopRequestedRef.current) {
            setListening(false);
            if (onListeningChangeRef.current) onListeningChangeRef.current(false);
            return;
          }
          window.setTimeout(() => restart(), 700);
          console.warn('Mic error:', err);
        },
        onEnd: () => {
          restartingRef.current = false;
          if (!enabledRef.current || stopRequestedRef.current) return;

          // Recognition stopped by browser — restart unless a flush is queued.
          if (silenceTimerRef.current !== null) {
            // Keep the pending flush; background restart below.
          }
          window.setTimeout(() => restart(), 250);
        },
      });

      if (started) {
        setListening(true);
        if (onListeningChangeRef.current) onListeningChangeRef.current(true);
      } else {
        setListening(false);
        if (onListeningChangeRef.current) onListeningChangeRef.current(false);
      }
    } finally {
      restartingRef.current = false;
    }
  }, [language, clearSilenceTimer, flushBuffer]);

  useEffect(() => {
    stopRequestedRef.current = false;
    if (enabled) {
      restart();
      attachAnalyser();
    }
    return () => {
      stopRequestedRef.current = true;
      SpeechService.stopListening();
      clearSilenceTimer();
      setListening(false);
      setInterim('');
      if (onListeningChangeRef.current) onListeningChangeRef.current(false);
      stopAnalyser();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, language]);

  return { listening, speaking, interim };
}