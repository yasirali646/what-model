"use client";

import { useState } from "react";
import { SpecOverride } from "./SpecOverride";

interface MobileConfigModalProps {
  initialVramGB: number;
  initialRamGB: number;
  detectedVramGB: number;
  detectedRamGB: number;
  onSave: (vramGB: number, ramGB: number) => void;
}

export function MobileConfigModal({
  initialVramGB,
  initialRamGB,
  detectedVramGB,
  detectedRamGB,
  onSave,
}: MobileConfigModalProps) {
  const [vramGB, setVramGB] = useState(initialVramGB);
  const [ramGB, setRamGB] = useState(initialRamGB);

  return (
    <div className="mobile-config-modal" role="dialog" aria-modal="true" aria-labelledby="mobile-config-title">
      <div className="mobile-config-backdrop" aria-hidden="true" />
      <div className="mobile-config-panel animate-in">
        <p className="font-data text-[0.5625rem] uppercase tracking-[0.2em] text-[var(--accent-bright)]">
          Device setup
        </p>
        <h2 id="mobile-config-title" className="mobile-config-title">
          Configure your hardware
        </h2>
        <p className="mobile-config-desc">
          Auto-scan reads the server this app runs on, not your phone or tablet.
          Set the GPU memory and RAM for the machine where you plan to run models.
        </p>

        <SpecOverride
          compact
          vramGB={vramGB}
          ramGB={ramGB}
          detectedVramGB={detectedVramGB}
          detectedRamGB={detectedRamGB}
          hasOverrides
          onVramChange={setVramGB}
          onRamChange={setRamGB}
          onReset={() => {
            setVramGB(initialVramGB);
            setRamGB(initialRamGB);
          }}
        />

        <button
          type="button"
          className="btn-primary mobile-config-save"
          onClick={() => onSave(vramGB, ramGB)}
        >
          Save and continue
        </button>
      </div>
    </div>
  );
}
