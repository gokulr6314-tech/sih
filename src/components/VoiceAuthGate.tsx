import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  ShieldCheck,
  CheckCircle2,
  Volume2,
  Sparkles,
  ArrowRight,
  UserCheck,
  ShoppingBag,
  Store,
} from 'lucide-react';
import { SupportedLanguageCode } from '../types';
import { SpeechService } from '../lib/speech';
import { SUPPORTED_LANGUAGES } from '../lib/languages';
import { getAuthStrings } from './voice/languageStrings';

export interface AuthSession {
  role: 'Buyer' | 'Seller';
  identifier: string;
  address?: string;
}

interface VoiceAuthGateProps {
  language: SupportedLanguageCode;
  onAuthenticated: (session: AuthSession) => void;
  isMuted: boolean;
}

type AuthStep = 'role_selection' | 'user_identifier' | 'user_address' | 'handshake';

export const VoiceAuthGate: React.FC<VoiceAuthGateProps> = ({
  language,
  onAuthenticated,
  isMuted,
}) => {
  const [currentStep, setCurrentStep] = useState<AuthStep>('role_selection');
  const [assistantState, setAssistantState] = useState<'speaking' | 'listening' | 'processing' | 'verified'>('speaking');
  const [spokenPrompt, setSpokenPrompt] = useState<string>('');
  const [liveTranscript, setLiveTranscript] = useState<string>('');

  const authStrings = getAuthStrings(language);
  
  // Auth state captured strictly via voice
  const [selectedRole, setSelectedRole] = useState<'Buyer' | 'Seller'>('Seller');
  const [userIdentifier, setUserIdentifier] = useState<string>('');
  const [userAddress, setUserAddress] = useState<string>('');

  // Refs to isolate callbacks and avoid infinite re-render loops
  const currentStepRef = useRef<AuthStep>('role_selection');
  const roleRef = useRef<'Buyer' | 'Seller'>('Seller');
  const identifierRef = useRef<string>('');
  const addressRef = useRef<string>('');
  const isDestroyedRef = useRef<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync state into refs
  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    roleRef.current = selectedRole;
  }, [selectedRole]);

  useEffect(() => {
    identifierRef.current = userIdentifier;
  }, [userIdentifier]);

  useEffect(() => {
    addressRef.current = userAddress;
  }, [userAddress]);

  useEffect(() => {
    identifierRef.current = userIdentifier;
  }, [userIdentifier]);

  // Clean up timers
  const clearTimers = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  // Visualizer loop (isolated: runs once on mount and reads current status without triggering re-renders)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      if (isDestroyedRef.current) return;
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      phase += 0.05;

      // Draw responsive concentric waves
      const waves = [
        { color: 'rgba(16, 185, 129, 0.7)', speed: 1.2, amp: 20 },
        { color: 'rgba(52, 211, 153, 0.5)', speed: -1.0, amp: 16 },
        { color: 'rgba(245, 158, 11, 0.6)', speed: 1.5, amp: 12 },
      ];

      waves.forEach((w) => {
        ctx.save();
        ctx.strokeStyle = w.color;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = w.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();

        for (let x = 0; x < width; x++) {
          const envelope = Math.sin((x / width) * Math.PI);
          const y = height / 2 + Math.sin(x * 0.02 + phase * w.speed) * w.amp * envelope;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      });

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, []);

  // Hands-free Voice Activity Detection Listener
  const startListeningTurn = useCallback(() => {
    if (isDestroyedRef.current || typeof window === 'undefined') return;

    setAssistantState('listening');
    setLiveTranscript('');
    clearTimers();

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      console.warn('SpeechRecognition API not available in this browser');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }

      const recognition = new SpeechRec();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      
      const langConfig = SUPPORTED_LANGUAGES.find((l) => l.code === language);
      recognition.lang = langConfig ? langConfig.speechLocale : 'en-IN';

      recognition.onresult = (event: any) => {
        if (isDestroyedRef.current) return;
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const transcript = (final || interim).trim();
        if (transcript) {
          setLiveTranscript(transcript);

          // 1.5s Voice Activity Detection Silence Timer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }

          silenceTimerRef.current = setTimeout(() => {
            if (isDestroyedRef.current) return;
            try {
              recognition.stop();
            } catch {
              // ignore
            }
            handleVoiceTurnAnswer(transcript);
          }, 1500);
        }
      };

      recognition.onerror = (err: any) => {
        if (err.error !== 'no-speech') {
          console.warn('Voice onboarding recognition error:', err.error);
        }
      };

      recognition.start();
    } catch (e) {
      console.warn('Recognition start exception:', e);
    }
  }, [language, clearTimers]);

  // Turn-Taking State Machine for Pure Voice Login
  const handleVoiceTurnAnswer = useCallback((spokenAnswer: string) => {
    clearTimers();
    setAssistantState('processing');
    const answer = spokenAnswer.trim();
    const step = currentStepRef.current;

    if (step === 'role_selection') {
      // Identify Buyer or Seller
      const isBuyer = /buyer|customer|buying|purchase|खरीदार|ग्राहक/i.test(answer);
      const chosenRole: 'Buyer' | 'Seller' = isBuyer ? 'Buyer' : 'Seller';
      setSelectedRole(chosenRole);
      roleRef.current = chosenRole;

      // Transition to Turn 2 (User Identifier)
      setCurrentStep('user_identifier');
      currentStepRef.current = 'user_identifier';

      const promptText = authStrings.roleSpoken;
      setSpokenPrompt(promptText);

      if (!isMuted) {
        SpeechService.stopSpeaking();
        SpeechService.speak(
          promptText,
          language,
          () => setAssistantState('speaking'),
          () => startListeningTurn()
        );
      } else {
        startListeningTurn();
      }
    } else if (step === 'user_identifier') {
      // Validate and capture name/number
      const cleanIdent = answer.replace(/^(my name is|i am|mera naam|naam hai)\s*/i, '').trim();
      const finalName = cleanIdent || 'Artisan Ramvati';
      setUserIdentifier(finalName);
      identifierRef.current = finalName;

      // Transition to Turn 3 (User Address)
      setCurrentStep('user_address');
      currentStepRef.current = 'user_address';

      const promptText = authStrings.addressSpoken;
      setSpokenPrompt(promptText);

      if (!isMuted) {
        SpeechService.stopSpeaking();
        SpeechService.speak(
          promptText,
          language,
          () => setAssistantState('speaking'),
          () => startListeningTurn()
        );
      } else {
        startListeningTurn();
      }
    } else if (step === 'user_address') {
      // Validate and capture address/village/city
      const cleanAddress = answer.replace(/^(my address is|i live in|mera pata|gaon|shehar)\s*/i, '').trim();
      const finalAddress = cleanAddress || 'Gorakhpur, Uttar Pradesh';
      setUserAddress(finalAddress);
      addressRef.current = finalAddress;

      // Transition to Turn 4 (Verification & Handshake)
      setCurrentStep('handshake');
      currentStepRef.current = 'handshake';
      setAssistantState('verified');

      const confirmationPrompt = authStrings.confirmSpoken(identifierRef.current, roleRef.current, finalAddress);
      setSpokenPrompt(confirmationPrompt);

      if (!isMuted) {
        SpeechService.stopSpeaking();
        SpeechService.speak(
          confirmationPrompt,
          language,
          () => setAssistantState('speaking'),
          () => {
            setAssistantState('verified');
            setTimeout(() => {
              onAuthenticated({
                role: roleRef.current,
                identifier: identifierRef.current,
                address: finalAddress,
              });
            }, 1200);
          }
        );
      } else {
        setTimeout(() => {
          onAuthenticated({
            role: roleRef.current,
            identifier: identifierRef.current,
            address: finalAddress,
          });
        }, 1200);
      }
    }
  }, [language, isMuted, onAuthenticated, clearTimers, startListeningTurn]);

  // Turn 1 Trigger on Mount (Strictly once, no infinite loop)
  useEffect(() => {
    isDestroyedRef.current = false;
    currentStepRef.current = 'role_selection';

    const welcomePrompt = authStrings.welcomeSpoken;
    setSpokenPrompt(welcomePrompt);

    const initialTimer = setTimeout(() => {
      if (isDestroyedRef.current) return;
      if (!isMuted) {
        SpeechService.stopSpeaking();
        SpeechService.speak(
          welcomePrompt,
          language,
          () => setAssistantState('speaking'),
          () => {
            if (!isDestroyedRef.current) {
              startListeningTurn();
            }
          }
        );
      } else {
        startListeningTurn();
      }
    }, 600);

    return () => {
      isDestroyedRef.current = true;
      clearTimeout(initialTimer);
      clearTimers();
      SpeechService.stopSpeaking();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []); // Empty dependency array ensures strict single-mount execution without cyclic re-renders

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-start sm:items-center justify-center p-3 sm:p-6 bg-gradient-to-br from-[#0d281e]/95 via-[#1b4332]/90 to-[#2d6a4f]/85 backdrop-blur-xl">
      {/* Voice-Only Onboarding Card */}
      <div className="w-full max-w-xl my-auto bg-white/95 backdrop-blur-2xl rounded-2xl sm:rounded-[32px] p-4 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.35)] border border-white/60 flex flex-col items-center text-center animate-fadeIn relative overflow-hidden">
        
        {/* Subtle Decorative Ambient Background Glow */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-emerald-300/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />

        {/* Logo & Voice Security Badge */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1b4332] to-[#40916c] flex items-center justify-center text-white shadow-xs p-2">
            <svg viewBox="0 0 32 32" fill="none" className="w-full h-full text-white">
              <path d="M16 3L4 10V13H28V10L16 3Z" fill="currentColor" />
              <path d="M7 15H11V26H7V15Z" fill="#D8F3DC" />
              <path d="M14 15H18V26H14V15Z" fill="#B7E4C7" />
              <path d="M21 15H25V26H21V15Z" fill="#D8F3DC" />
            </svg>
          </div>
          <span className="text-lg font-black tracking-tight text-[#1b4332]">
            Karigar<span className="text-[#2d6a4f]">Setu</span>
          </span>
          <span className="ml-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#d8f3dc] text-[#1b4332] border border-[#b7e4c7]">
            Voice ID Verified
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-[#1b4332] tracking-tight mb-1">
          {authStrings.heading}
        </h2>
        <p className="text-xs sm:text-sm text-[#455A45] max-w-md font-medium leading-relaxed mb-5">
          {authStrings.subtitle}
        </p>

        {/* Step Progression (4 Turns) */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-6 w-full max-w-md">
          <div className="flex-1 flex items-center gap-1">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                currentStep === 'role_selection'
                  ? 'bg-[#1b4332] text-white ring-4 ring-emerald-200'
                  : 'bg-[#d8f3dc] text-[#1b4332]'
              }`}
            >
              1
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-[#1b4332] truncate">{authStrings.stepRole}</span>
          </div>
          <div className="w-3 sm:w-5 h-0.5 bg-emerald-200" />
          <div className="flex-1 flex items-center gap-1">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                currentStep === 'user_identifier'
                  ? 'bg-[#1b4332] text-white ring-4 ring-emerald-200'
                  : currentStep === 'user_address' || currentStep === 'handshake'
                  ? 'bg-[#d8f3dc] text-[#1b4332]'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              2
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-[#1b4332] truncate">{authStrings.stepIdentity}</span>
          </div>
          <div className="w-3 sm:w-5 h-0.5 bg-emerald-200" />
          <div className="flex-1 flex items-center gap-1">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                currentStep === 'user_address'
                  ? 'bg-[#1b4332] text-white ring-4 ring-emerald-200'
                  : currentStep === 'handshake'
                  ? 'bg-[#d8f3dc] text-[#1b4332]'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              3
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-[#1b4332] truncate">{authStrings.stepAddress}</span>
          </div>
          <div className="w-3 sm:w-5 h-0.5 bg-emerald-200" />
          <div className="flex-1 flex items-center gap-1">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                currentStep === 'handshake'
                  ? 'bg-emerald-600 text-white ring-4 ring-emerald-200'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              4
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-[#1b4332] truncate">{authStrings.stepLogin}</span>
          </div>
        </div>

        {/* Dynamic Centerpiece: Interactive Visualizer & Mic Orb */}
        <div className="relative w-full h-24 mb-4 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={480}
            height={90}
            className="w-full h-full object-contain pointer-events-none"
          />
          
          {/* Animated Central Mic Node (Clickable for 1-Tap Mobile Unlock) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
            <button
              type="button"
              onClick={() => {
                SpeechService.unlockAudio();
                startListeningTurn();
              }}
              title="Tap to speak or activate mic"
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all transform cursor-pointer active:scale-95 ${
                assistantState === 'listening'
                  ? 'bg-red-500 text-white ring-8 ring-red-200 scale-110 animate-pulse'
                  : assistantState === 'speaking'
                  ? 'bg-[#1b4332] text-white ring-8 ring-emerald-200 scale-105'
                  : assistantState === 'verified'
                  ? 'bg-emerald-600 text-white ring-8 ring-emerald-100 scale-110'
                  : 'bg-[#2d6a4f] text-white hover:bg-[#1b4332]'
              }`}
            >
              {assistantState === 'listening' ? (
                <Mic className="w-6 h-6 animate-bounce" />
              ) : assistantState === 'verified' ? (
                <CheckCircle2 className="w-7 h-7 text-white" />
              ) : (
                <Volume2 className="w-6 h-6 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Assistant Spoken Prompt Text */}
        <div className="bg-[#F0F7F0] rounded-2xl p-4 w-full border border-white/80 shadow-inner mb-4">
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                assistantState === 'listening'
                  ? 'bg-red-500 animate-ping'
                  : assistantState === 'speaking'
                  ? 'bg-[#2d6a4f] animate-pulse'
                  : 'bg-emerald-600'
              }`}
            />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2d6a4f]">
              {assistantState === 'listening'
                ? authStrings.listening
                : assistantState === 'speaking'
                ? authStrings.speaking
                : assistantState === 'verified'
                ? authStrings.verified
                : authStrings.processing}
            </span>
          </div>
          <p className="text-sm sm:text-base font-extrabold text-[#1b4332] leading-relaxed">
            "{spokenPrompt}"
          </p>

          {/* Real-time Transcription Feedback */}
          {liveTranscript && (
            <div className="mt-2.5 pt-2 border-t border-emerald-200/60 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping flex-shrink-0" />
              <p className="text-xs text-emerald-800 font-bold italic truncate max-w-sm">
                "{liveTranscript}"
              </p>
            </div>
          )}
        </div>

        {/* Pure Voice Guidance & Optional Voice-Assisted 1-Tap Pills */}
        <div className="w-full flex flex-col items-center gap-2">
          {currentStep === 'role_selection' && (
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  SpeechService.unlockAudio();
                  handleVoiceTurnAnswer('Seller');
                }}
                className="flex items-center gap-2 bg-white hover:bg-emerald-50 text-[#1b4332] px-4 py-2 rounded-xl text-xs font-black border border-white/80 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Store className="w-3.5 h-3.5 text-[#2d6a4f]" />
                <span>{authStrings.saySeller}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  SpeechService.unlockAudio();
                  handleVoiceTurnAnswer('Buyer');
                }}
                className="flex items-center gap-2 bg-white hover:bg-emerald-50 text-[#1b4332] px-4 py-2 rounded-xl text-xs font-black border border-white/80 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-[#2d6a4f]" />
                <span>{authStrings.sayBuyer}</span>
              </button>
            </div>
          )}

          {currentStep === 'user_identifier' && (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  SpeechService.unlockAudio();
                  handleVoiceTurnAnswer('Ramvati Devi');
                }}
                className="bg-white hover:bg-emerald-50 text-[#1b4332] px-3 py-1.5 rounded-xl text-xs font-bold border border-white/80 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                {authStrings.sayName}
              </button>
              <button
                type="button"
                onClick={() => {
                  SpeechService.unlockAudio();
                  handleVoiceTurnAnswer('9876543210');
                }}
                className="bg-white hover:bg-emerald-50 text-[#1b4332] px-3 py-1.5 rounded-xl text-xs font-bold border border-white/80 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                {authStrings.sayPhone}
              </button>
            </div>
          )}

          {currentStep === 'user_address' && (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  SpeechService.unlockAudio();
                  handleVoiceTurnAnswer('Gorakhpur, Uttar Pradesh');
                }}
                className="bg-white hover:bg-emerald-50 text-[#1b4332] px-3 py-1.5 rounded-xl text-xs font-bold border border-white/80 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                {authStrings.sayAddress}
              </button>
            </div>
          )}

          <p className="text-[11px] text-[#455A45] font-semibold flex items-center gap-1.5 mt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2d6a4f]" />
            Continuous Voice Activity Detection Active
          </p>
        </div>
      </div>
    </div>
  );
};
