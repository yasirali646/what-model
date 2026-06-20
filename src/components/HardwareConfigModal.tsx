"use client";

import { useEffect, useState } from "react";
import { SpecOverride } from "./SpecOverride";
import { detectBrowserHardware, type BrowserHardwareInfo } from "@/lib/hardware/browser-detect";

interface HardwareConfigModalProps {
  initialVramGB: number;
  initialRamGB: number;
  onSave: (vramGB: number, ramGB: number) => void;
  cloudHosted?: boolean;
}

export function HardwareConfigModal({
  initialVramGB,
  initialRamGB,
  onSave,
  cloudHosted = false,
}: HardwareConfigModalProps) {
  const [vramGB, setVramGB] = useState(initialVramGB);
  const [ramGB, setRamGB] = useState(initialRamGB);
  const [hwInfo, setHwInfo] = useState<BrowserHardwareInfo | null>(null);
  const [probing, setProbing] = useState(true);

  useEffect(() => {
    let cancelled = false;
    detectBrowserHardware().then((info) => {
      if (cancelled) return;
      setHwInfo(info);
      if (info.estimatedVramGB !== null) setVramGB(info.estimatedVramGB);
      if (info.estimatedRamGB !== null && info.estimatedRamGB > ramGB) {
        setRamGB(info.estimatedRamGB);
      }
      setProbing(false);
    });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const detected = hwInfo?.detected ?? false;

  return (
    <div className="mobile-config-modal" role="dialog" aria-modal="true" aria-labelledby="hw-config-title">
      <div className="mobile-config-backdrop" aria-hidden="true" />
      <div className="mobile-config-panel animate-in">
        <p className="font-data text-[0.5625rem] uppercase tracking-[0.2em] text-[var(--accent-bright)]">
          {cloudHosted ? "Cloud mode" : "Device setup"}
        </p>
        <h2 id="hw-config-title" className="mobile-config-title">
          {probing
            ? "Detecting hardware\u2026"
            : detected
              ? "Hardware detected"
              : "Configure your hardware"}
        </h2>

        {probing ? (
          <p className="mobile-config-desc">
            Probing your GPU memory via WebGPU. This takes a few seconds.
          </p>
        ) : (
          <>
            {detected && hwInfo?.gpuRenderer && (
              <div className="hw-detected-info">
                <p className="hw-detected-gpu">{hwInfo.gpuRenderer}</p>
                {hwInfo.estimatedVramGB !== null && (
                  <p className="hw-detected-stat">
                    ~{hwInfo.estimatedVramGB} GB VRAM detected
                  </p>
                )}
                {hwInfo.cores !== null && (
                  <p className="hw-detected-stat">
                    {hwInfo.cores} CPU threads
                  </p>
                )}
              </div>
            )}
            <p className="mobile-config-desc">
              {detected
                ? "Values below are pre-filled from your browser. Adjust if needed for the machine where you run models."
                : cloudHosted
                  ? "Your browser could not detect GPU memory. Enter the VRAM and RAM of the machine where you plan to run models."
                  : "Auto-detection was not available. Set the GPU memory and RAM for the machine where you plan to run models."}
            </p>
          </>
        )}

        <SpecOverride
          compact
          vramGB={vramGB}
          ramGB={ramGB}
          detectedVramGB={0}
          detectedRamGB={0}
          hasOverrides
          onVramChange={setVramGB}
          onRamChange={setRamGB}
          onReset={() => {
            setVramGB(hwInfo?.estimatedVramGB ?? initialVramGB);
            setRamGB(hwInfo?.estimatedRamGB ?? initialRamGB);
          }}
        />

        <button
          type="button"
          className="btn-primary mobile-config-save"
          onClick={() => onSave(vramGB, ramGB)}
          disabled={probing}
        >
          {probing ? "Detecting\u2026" : detected ? "Confirm and continue" : "Save and continue"}
        </button>
      </div>
    </div>
  );
}
