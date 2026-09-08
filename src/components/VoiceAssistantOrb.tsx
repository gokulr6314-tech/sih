import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { SupportedLanguageCode } from '../types';
import { SpeechService } from '../lib/speech';
import { TRANSLATIONS } from '../lib/languages';

interface VoiceAssistantOrbProps {
  currentPrompt: string;
  language: SupportedLanguageCode;
  onVoiceResult: (text: string) => void;
  isProcessing?: boolean;
  stepHint?: string;
  suggestedPhrases?: string[];
}

export const VoiceAssistantOrb: React.FC<VoiceAssistantOrbProps> = ({
  currentPrompt,
  language,
  onVoiceResult,
  isProcessing = false,
  stepHint,
  suggestedPhrases = [],
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [muted, setMuted] = useState(false);
  const [micSupported, setMicSupported] = useState(true);

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Speak prompt whenever it changes and not muted
  useEffect(() => {
    if (currentPrompt && !muted) {
      setIsSpeaking(true);
      SpeechService.speak(
        currentPrompt,
        language,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );
    }
    return () => {
      SpeechService.stopSpeaking();
    };
  }, [currentPrompt, language, muted]);

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      SpeechService.stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      SpeechService.speak(
        currentPrompt,
        language,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );
    }
  };

  const handleToggleListen = () => {
    if (isListening) {
      SpeechService.stopListening();
      setIsListening(false);
      return;
    }

    SpeechService.stopSpeaking();
    setIsSpeaking(false);
    setLiveTranscript('');

    const started = SpeechService.startListening(language, {
      onResult: (text, isFinal) => {
        setLiveTranscript(text);
        if (isFinal) {
          setIsListening(false);
          onVoiceResult(text);
        }
      },
      onError: (err) => {
        console.warn('Mic speech error:', err);
        setIsListening(false);
        setMicSupported(false);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    if (started) {
      setIsListening(true);
    }
  };

  const handlePhraseClick = (phrase: string) => {
    setLiveTranscript(phrase);
    onVoiceResult(phrase);
  };

  return (
    <div className="bg-[#F0F7F0]/90 backdrop-blur-md rounded-2xl sm:rounded-[32px] p-3.5 sm:p-5 shadow-[8px_8px_16px_#d1dbd1,-8px_-8px_16px_#ffffff] border border-white/60 mb-3 sm:mb-5 relative overflow-hidden transition-all">
      {/* Top Bar with Badge & Voice Waveform */}
      <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="py-0.5 px-2.5 sm:py-1 sm:px-3 bg-[#C8E6C9] rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#2E7D32] border border-white/50 shadow-xs">
            {t.voiceAssistant}
          </span>
          {stepHint && (
            <span className="text-[11px] sm:text-xs text-[#455A45] font-medium hidden sm:inline">
              • {stepHint}
            </span>
          )}
        </div>

        {/* Voice Waveform Visualization */}
        <div className="flex items-center gap-1 sm:gap-1.5 h-5 sm:h-6 px-2 sm:px-3 py-0.5 sm:py-1 bg-white/50 rounded-full border border-white/70 shadow-inner">
          <div className={`w-0.5 sm:w-1 bg-[#81C784] rounded-full ${isSpeaking || isListening ? 'h-3 sm:h-4 animate-pulse' : 'h-1.5 sm:h-2'}`} />
          <div className={`w-0.5 sm:w-1 bg-[#4CAF50] rounded-full ${isSpeaking || isListening ? 'h-5 sm:h-6' : 'h-2 sm:h-3'}`} />
          <div className={`w-0.5 sm:w-1 bg-[#2E7D32] rounded-full ${isSpeaking || isListening ? 'h-4 sm:h-5' : 'h-1.5 sm:h-2'}`} />
          <div className={`w-0.5 sm:w-1 bg-[#81C784] rounded-full ${isSpeaking || isListening ? 'h-5 sm:h-6' : 'h-2 sm:h-3'}`} />
          <div className={`w-0.5 sm:w-1 bg-[#4CAF50] rounded-full ${isSpeaking || isListening ? 'h-2.5 sm:h-3' : 'h-1 sm:h-1.5'}`} />
          <div className={`w-0.5 sm:w-1 bg-[#2E7D32] rounded-full ${isSpeaking || isListening ? 'h-4 sm:h-5' : 'h-1.5 sm:h-2'}`} />
        </div>

        <button
          type="button"
          onClick={() => setMuted(!muted)}
          className="p-1 sm:p-1.5 text-[#455A45] hover:text-[#2D422D] rounded-xl hover:bg-white/60 transition-colors"
          title={muted ? 'Unmute voice' : 'Mute voice'}
        >
          {muted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
        </button>
      </div>

      <div className="flex flex-row items-center gap-3 sm:gap-4">
        {/* Compact AI Voice Trigger Orb */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <button
            type="button"
            onClick={handleToggleListen}
            title={isListening ? 'Stop listening' : t.tapToSpeak}
            className={`w-14 h-14 sm:w-20 sm:h-20 rounded-full flex items-center justify-center border-2 sm:border-4 border-[#F0F7F0] transition-all transform active:scale-95 ${
              isListening
                ? 'bg-red-500 shadow-[6px_6px_12px_#fca5a5,-6px_-6px_12px_#ffffff] text-white ring-3 ring-red-200'
                : isSpeaking
                ? 'bg-[#81C784] shadow-[6px_6px_12px_#c8d6c8,-6px_-6px_12px_#ffffff] text-white iso-voice-pulse'
                : 'bg-[#81C784] hover:bg-[#4CAF50] shadow-[6px_6px_12px_#c8d6c8,-6px_-6px_12px_#ffffff] text-white'
            }`}
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center shadow-inner">
              {isListening ? (
                <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 animate-bounce" />
              ) : isSpeaking ? (
                <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#4CAF50] animate-pulse" />
              ) : (
                <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-[#81C784] rounded-full" />
              )}
            </div>
          </button>
          <span className="text-[9px] sm:text-[10px] font-bold text-[#455A45] uppercase tracking-wider mt-1">
            {isListening ? 'Listening...' : t.tapToSpeak}
          </span>
        </div>

        {/* Prompt Dialog & Controls */}
        <div className="flex-1 min-w-0 text-left">
          {/* Current Spoken Prompt */}
          <h3 className="text-[#2D422D] font-bold text-xs sm:text-base leading-snug line-clamp-2 sm:line-clamp-none">
            "{currentPrompt}"
          </h3>

          {/* Live Voice Feedback */}
          {isListening && (
            <div className="mt-2.5 flex items-center gap-2 bg-[#E1EBE1] px-3 py-2 rounded-xl border border-white/60 shadow-inner">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <span className="text-xs font-semibold text-[#2D422D]">
                {liveTranscript || t.listening}
              </span>
            </div>
          )}

          {isProcessing && (
            <div className="mt-2 flex items-center justify-center sm:justify-start gap-2 text-xs font-medium text-[#2E7D32]">
              <div className="w-3.5 h-3.5 border-2 border-[#4CAF50] border-t-transparent rounded-full animate-spin" />
              <span>{t.aiThinking}</span>
            </div>
          )}

          {/* Voice Action Buttons */}
          <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <button
              type="button"
              onClick={handleToggleSpeak}
              className="bg-white/80 hover:bg-white text-[#2D422D] px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-[3px_3px_8px_#d1dbd1,-3px_-3px_8px_#ffffff] border border-white/80 flex items-center gap-1.5 transition-all"
            >
              <Volume2 className="w-3.5 h-3.5 text-[#4CAF50]" />
              <span>सुनें (Repeat Audio)</span>
            </button>
          </div>

          {/* Quick Speech Chips */}
          {suggestedPhrases.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-white/60">
              <div className="text-[11px] font-medium text-[#455A45] mb-1.5">
                बोलें या एक-क्लिक से चुनें (Quick Voice Options):
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                {suggestedPhrases.map((phrase, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePhraseClick(phrase)}
                    className="bg-white/60 hover:bg-white text-[#2D422D] px-2.5 py-1 text-xs rounded-xl border border-white/80 shadow-[2px_2px_6px_#d1dbd1,-2px_-2px_6px_#ffffff] transition-all hover:border-[#81C784]"
                  >
                    "{phrase}"
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
