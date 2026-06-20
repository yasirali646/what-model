"use client";

import {
  CONTEXT_PRESETS,
  formatContextLabel,
} from "@/lib/engine/vram";

interface ContextSliderProps {
  contextTokens: number;
  onChange: (tokens: number) => void;
}

export function ContextSlider({ contextTokens, onChange }: ContextSliderProps) {
  const index = Math.max(
    0,
    CONTEXT_PRESETS.findIndex((p) => p === contextTokens),
  );

  return (
    <div>
      <div className="mb-2 flex justify-between">
        <label
          htmlFor="context-length"
          className="font-data text-[0.625rem] uppercase tracking-[0.1em] text-[var(--text-dim)]"
        >
          Context length
        </label>
        <span className="font-data text-sm text-[var(--accent-bright)]">
          {formatContextLabel(contextTokens)}
        </span>
      </div>
      <input
        id="context-length"
        type="range"
        min={0}
        max={CONTEXT_PRESETS.length - 1}
        step={1}
        value={index}
        onChange={(e) =>
          onChange(CONTEXT_PRESETS[parseInt(e.target.value, 10)])
        }
        className="slider w-full"
      />
      <div className="mt-1 flex justify-between">
        {CONTEXT_PRESETS.map((preset) => (
          <span
            key={preset}
            className={`font-data text-[0.5625rem] ${
              preset === contextTokens
                ? "text-[var(--accent-bright)]"
                : "text-[var(--text-dim)]"
            }`}
          >
            {formatContextLabel(preset)}
          </span>
        ))}
      </div>
    </div>
  );
}
