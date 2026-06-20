import type { SystemProfile, ComputeBackend } from "@/types";

const BACKEND_LABELS: Record<ComputeBackend, string> = {
  nvidia_cuda: "CUDA",
  apple_metal: "Metal",
  amd_rocm: "ROCm",
  cpu_only: "CPU",
};

export function SystemPanel({ profile }: { profile: SystemProfile }) {
  const ramPct = Math.round(
    (profile.ram.freeGB / profile.ram.totalGB) * 100,
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-px bg-[var(--border)] md:grid-cols-3">
        <div className="readout animate-in animate-in-delay-1">
          <p className="panel-label mb-3">Processor</p>
          <p className="readout-value">
            {profile.cpu.cores}
            <span className="readout-unit">cores</span>
          </p>
          <div className="mt-4 space-y-0">
            <div className="readout-row">
              <span className="readout-row-label">Model</span>
              <span className="readout-row-value">{profile.cpu.brand}</span>
            </div>
            <div className="readout-row">
              <span className="readout-row-label">Threads</span>
              <span className="readout-row-value">{profile.cpu.threads}</span>
            </div>
            <div className="readout-row">
              <span className="readout-row-label">Clock</span>
              <span className="readout-row-value">
                {profile.cpu.speedGHz} GHz
              </span>
            </div>
          </div>
        </div>

        <div className="readout animate-in animate-in-delay-2">
          <p className="panel-label mb-3">System Memory</p>
          <p className="readout-value">
            {profile.ram.totalGB}
            <span className="readout-unit">GB</span>
          </p>
          <div className="mt-4 space-y-0">
            <div className="readout-row">
              <span className="readout-row-label">Available</span>
              <span className="readout-row-value">
                {profile.ram.freeGB} GB ({ramPct}%)
              </span>
            </div>
            <div className="readout-row">
              <span className="readout-row-label">Model budget</span>
              <span className="readout-row-value">
                {profile.ram.usableGB} GB
              </span>
            </div>
            <div className="readout-row">
              <span className="readout-row-label">Host</span>
              <span className="readout-row-value">{profile.os.hostname}</span>
            </div>
          </div>
        </div>

        <div className="readout animate-in animate-in-delay-3">
          <p className="panel-label mb-3">Graphics</p>
          <p className="readout-value">
            {profile.usableVramGB > 0 ? profile.usableVramGB : "N/A"}
            {profile.usableVramGB > 0 && (
              <span className="readout-unit">GB VRAM</span>
            )}
          </p>
          <div className="mt-4 space-y-0">
            <div className="readout-row">
              <span className="readout-row-label">Backend</span>
              <span
                className="readout-row-value"
                style={{ color: "var(--accent-bright)" }}
              >
                {BACKEND_LABELS[profile.computeBackend]}
              </span>
            </div>
            {profile.gpus.length === 0 ? (
              <div className="readout-row">
                <span className="readout-row-label">Device</span>
                <span className="readout-row-value">None detected</span>
              </div>
            ) : (
              profile.gpus.map((gpu, i) => (
                <div key={i} className="readout-row">
                  <span className="readout-row-label">
                    {i === 0 ? "Device" : `GPU ${i + 1}`}
                  </span>
                  <span className="readout-row-value">{gpu.model}</span>
                </div>
              ))
            )}
            {profile.multiGpu && (
              <div className="readout-row">
                <span className="readout-row-label">Combined</span>
                <span className="readout-row-value">
                  {profile.totalVramGB} GB
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {profile.detectionWarnings.length > 0 && (
        <div className="warning-banner space-y-1">
          {profile.detectionWarnings.map((w, i) => (
            <p key={i}>{w}</p>
          ))}
        </div>
      )}
    </div>
  );
}
