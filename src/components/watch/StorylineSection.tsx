import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlignLeft } from 'lucide-react';

interface StorylineSectionProps {
  overview?: string;
  tagline?: string;
}

export function StorylineSection({ overview, tagline }: StorylineSectionProps) {
  const [expanded, setExpanded] = useState(false);

  const fallbackText =
    'When unexpected circumstances push loyalty and courage to the edge, an unforgettable journey unfolds through thrilling twists, emotional depth, and relentless action.';

  const text = overview && overview.trim().length > 0 ? overview.trim() : fallbackText;
  const isLong = text.length > 220;

  return (
    <div className="rounded-2xl bg-[#111318] border border-white/[0.07] p-5 sm:p-6 shadow-xl space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-[#A1A7B5] uppercase tracking-wider">
        <AlignLeft className="w-3.5 h-3.5 text-[#F5C518]" />
        <span>Storyline</span>
      </div>

      {tagline && (
        <p className="text-xs sm:text-sm italic font-medium text-[#F5C518]/90">
          "{tagline}"
        </p>
      )}

      <div className="relative">
        <p
          className={`text-[15px] sm:text-[16px] text-[#A1A7B5] leading-relaxed transition-all duration-300 ${
            !expanded && isLong ? 'line-clamp-3 sm:line-clamp-4' : ''
          }`}
        >
          {text}
        </p>

        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#F5C518] hover:text-[#FFD633] transition-colors cursor-pointer"
          >
            <span>{expanded ? 'Show less' : 'Read more'}</span>
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
