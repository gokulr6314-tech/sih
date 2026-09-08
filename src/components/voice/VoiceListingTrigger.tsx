/**
 * Module 2 — Floating Voice Listing Trigger
 * A docked, always-available pill (bottom-center) that opens the Voice Listing
 * Assistant. Repositioned to bottom-center with a larger, more dynamic mic button.
 */

import { Mic } from 'lucide-react';

interface VoiceListingTriggerProps {
  onClick: () => void;
  isActive?: boolean;
  isInterviewInProgress?: boolean;
}

export default function VoiceListingTrigger({
  onClick,
  isActive,
  isInterviewInProgress,
}: VoiceListingTriggerProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Open voice listing assistant"
      className={`fixed bottom-7 left-1/2 -translate-x-1/2 z-40 inline-flex flex-col items-center gap-2 cursor-pointer group transition-all duration-300 ${
        isActive ? 'scale-95' : 'hover:scale-105'
      }`}
      style={{ filter: isActive ? 'brightness(1.1)' : undefined }}
    >
      {/* Outer pulsing ring */}
      {(isInterviewInProgress || !isActive) && (
        <span className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-emerald-400/25 animate-ping pointer-events-none" />
      )}

      {/* Main mic button */}
      <div
        className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(45,106,79,0.55)] transition-all duration-300 ${
          isActive
            ? 'bg-gradient-to-br from-rose-500 to-pink-600 ring-4 ring-rose-300/50'
            : 'bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-emerald-500 ring-4 ring-emerald-400/30 group-hover:ring-emerald-300/60'
        }`}
      >
        {isInterviewInProgress && (
          <span className="absolute inset-[-6px] rounded-full border-2 border-emerald-400/60 animate-ping pointer-events-none" />
        )}
        <Mic size={26} className="text-white drop-shadow-sm" />
      </div>

      {/* Label pill */}
      <span
        className={`px-3.5 py-1 rounded-full text-[11px] font-extrabold tracking-wide uppercase backdrop-blur-md border shadow-lg transition-all duration-300 ${
          isActive
            ? 'bg-rose-500/90 text-white border-rose-300/50'
            : 'bg-[#1b4332]/90 text-emerald-100 border-emerald-400/30 group-hover:bg-[#2d6a4f]/95'
        }`}
      >
        {isActive ? 'Listing Active…' : '🎙 Voice Listing'}
      </span>
    </button>
  );
}