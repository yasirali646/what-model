"use client";

import { useEffect, useState } from "react";
import {
  detectBrowserHardware,
  type BrowserHardwareInfo,
} from "@/lib/hardware/browser-detect";

interface CloudSystemPanelProps {
  vramGB: number;
  ramGB: number;
  onEditConfig: () => void;
}

export function CloudSystemPanel({
  vramGB,
  ramGB,
  onEditConfig,
}: CloudSystemPanelProps) {
  const [hw, setHw] = useState<BrowserHardwareInfo | null>(null);
  const [probing, setProbing] = useState(true);

  useEffect(() => {
    let cancelled = false;
    detectBrowserHardware().then((info) => {
      if (!cancelled) {
        setHw(info);
        setProbing(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const gpuName = hw?.gpuRenderer ?? null;
  const cores = hw?.cores ?? null;
  const vendor = hw?.gpuVendor ?? null;

  const isNvidia = vendor?.toLowerCase().includes("nvidia");
  const isAmd = vendor?.toLowerCase().includes("amd") || vendor?.toLowerCase().includes("ati");
  const isApple = vendor?.toLowerCase().includes("apple");

  const backendLabel = isNvidia
    ? "CUDA"
    : isApple
      ? "Metal"
      : isAmd
        ? "ROCm"
        : "CPU";

  return (
    <div className="space-y-4">
      <div className="grid gap-px bg-[var(--border)] md:grid-cols-3">
        <div className="readout animate-in animate-in-delay-1">
          <p className="panel-label mb-3">Processor</p>
          <p className="readout-value">
            {cores ?? "\u2014"}
            {cores && <span className="readout-unit">threads</span>}
          </p>
          <div className="mt-4 space-y-0">
            <div className="readout-row">
              <span className="readout-row-label">Source</span>
              <span className="readout-row-value">Browser detected</span>
            </div>
          </div>
        </div>

        <div className="readout animate-in animate-in-delay-2">
          <p className="panel-label mb-3">System Memory</p>
          <p className="readout-value">
            {ramGB}
            <span className="readout-unit">GB</span>
          </p>
          <div className="mt-4 space-y-0">
            <div className="readout-row">
              <span className="readout-row-label">Model budget</span>
              <span className="readout-row-value">{ramGB} GB</span>
            </div>
          </div>
        </div>

        <div className="readout animate-in animate-in-delay-3">
          <p className="panel-label mb-3">Graphics</p>
          <p className="readout-value">
            {probing ? (
              <span className="readout-unit">Detecting...</span>
            ) : vramGB > 0 ? (
              <>
                {vramGB}
                <span className="readout-unit">GB VRAM</span>
              </>
            ) : (
              "N/A"
            )}
          </p>
          <div className="mt-4 space-y-0">
            <div className="readout-row">
              <span className="readout-row-label">Backend</span>
              <span
                className="readout-row-value"
                style={{ color: "var(--accent-bright)" }}
              >
                {backendLabel}
              </span>
            </div>
            {gpuName && (
              <div className="readout-row">
                <span className="readout-row-label">Device</span>
                <span className="readout-row-value">{gpuName}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="cloud-hw-banner">
        <p className="cloud-hw-banner-text">
          {hw?.detected
            ? "Detected via your browser. If this does not match the machine where you run models, edit the configuration."
            : "Could not auto-detect your hardware. Values shown are based on your input."}
        </p>
        <button
          type="button"
          className="btn-small"
          onClick={onEditConfig}
        >
          Edit configuration
        </button>
      </div>
    </div>
  );
}
