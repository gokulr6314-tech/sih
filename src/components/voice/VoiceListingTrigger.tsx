/**
 * Module 2 — Floating Voice Listing Trigger
 * A docked, always-available pill (bottom-right) that opens the Voice Listing
 * Assistant. Uses navItems language copy so it reads in the artisan's tongue.
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
      className={`fixed bottom-6 right-5 z-40 inline-flex items-center gap-2.5 rounded-full px-4 py-3 text-sm font-semibold shadow-xl transition-all duration-300 ${
        isActive
          ? 'bg-emerald-600 text-white ring-2 ring-emerald-300/60'
          : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:scale-[1.03] hover:shadow-emerald-500/30'
      }`}
      style={{ animation: isInterviewInProgress ? 'pulse-ring 2.2s infinite' : undefined }}
    >
      <span className="relative flex h-7 w-7 items-center justify-center">
        {isInterviewInProgress ? (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/40" />
        ) : null}
        <Mic size={18} />
      </span>
      <span>Voice Listing</span>
    </button>
  );
}