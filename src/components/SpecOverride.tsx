"use client";

interface SpecOverrideProps {
  vramGB: number;
  ramGB: number;
  detectedVramGB: number;
  detectedRamGB: number;
  hasOverrides: boolean;
  onVramChange: (v: number) => void;
  onRamChange: (v: number) => void;
  onReset: () => void;
  compact?: boolean;
}

export function SpecOverride({
  vramGB,
  ramGB,
  detectedVramGB,
  detectedRamGB,
  hasOverrides,
  onVramChange,
  onRamChange,
  onReset,
  compact = false,
}: SpecOverrideProps) {
  const fields = (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex justify-between">
          <label className="font-data text-[0.625rem] uppercase tracking-[0.1em] text-[var(--text-dim)]">
            GPU VRAM
          </label>
          <span className="font-data text-sm text-[var(--accent-bright)]">
            {vramGB} GB
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={96}
          step={0.5}
          value={vramGB}
          onChange={(e) => onVramChange(parseFloat(e.target.value))}
          className="slider w-full"
        />
        <p className="font-data mt-1 text-[0.5625rem] text-[var(--text-dim)]">
          Detected: {detectedVramGB} GB
        </p>
      </div>

      <div>
        <div className="mb-2 flex justify-between">
          <label className="font-data text-[0.625rem] uppercase tracking-[0.1em] text-[var(--text-dim)]">
            Usable RAM
          </label>
          <span className="font-data text-sm text-[var(--accent-bright)]">
            {ramGB} GB
          </span>
        </div>
        <input
          type="range"
          min={4}
          max={256}
          step={1}
          value={ramGB}
          onChange={(e) => onRamChange(parseFloat(e.target.value))}
          className="slider w-full"
        />
        <p className="font-data mt-1 text-[0.5625rem] text-[var(--text-dim)]">
          Detected: {detectedRamGB} GB
        </p>
      </div>

      <button
        type="button"
        onClick={onReset}
        disabled={!hasOverrides}
        className="btn-small"
      >
        Reset to detected configuration
      </button>
    </div>
  );

  if (compact) {
    return (
      <div className="border border-[var(--border)] bg-[var(--surface-raised)] p-3">
        {hasOverrides && (
          <p className="font-data mb-3 text-[0.5625rem] uppercase tracking-[0.12em] text-[var(--amber)]">
            Using manual values
          </p>
        )}
        {fields}
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-label">Manual Override</span>
        {hasOverrides && (
          <span className="badge badge-accent">Modified</span>
        )}
      </div>
      <div className="panel-body">{fields}</div>
    </div>
  );
}
