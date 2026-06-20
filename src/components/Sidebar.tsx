"use client";

import type { SystemProfile, UseCase, ModelFamily, OllamaStatus } from "@/types";
import { MODEL_FAMILIES, MODEL_FAMILY_LABELS } from "@/lib/models/catalog";
import { getFamilyStyle } from "@/lib/models/family-style";
import { FamilyNavContent } from "./FamilyBadge";
import { SpecOverride } from "./SpecOverride";
import { ContextSlider } from "./ContextSlider";
import { ollamaStatusLabel } from "./ModelCard";

const USE_CASES: { id: UseCase | "all"; label: string }[] = [
  { id: "all", label: "All models" },
  { id: "chat", label: "Chat" },
  { id: "coding", label: "Coding" },
  { id: "reasoning", label: "Reasoning" },
  { id: "vision", label: "Vision" },
  { id: "embedding", label: "Embedding" },
];

const FAMILY_OPTIONS: { id: ModelFamily | "all"; label: string }[] = [
  { id: "all", label: "All families" },
  ...MODEL_FAMILIES.map((family) => ({
    id: family,
    label: MODEL_FAMILY_LABELS[family],
  })),
];

const BACKEND_LABELS: Record<SystemProfile["computeBackend"], string> = {
  nvidia_cuda: "CUDA",
  apple_metal: "Metal",
  amd_rocm: "ROCm",
  cpu_only: "CPU",
};

const NAV_ITEMS = [
  { id: "system", label: "Hardware" },
  { id: "recommendations", label: "Models" },
  { id: "compare", label: "Compare" },
  { id: "faq", label: "FAQ" },
];

interface SidebarProps {
  profile: SystemProfile | null;
  loading: boolean;
  useCase: UseCase | "all";
  onUseCaseChange: (uc: UseCase | "all") => void;
  family: ModelFamily | "all";
  onFamilyChange: (family: ModelFamily | "all") => void;
  onRescan: () => void;
  runnable: number;
  total: number;
  vramGB: number;
  ramGB: number;
  detectedVramGB: number;
  detectedRamGB: number;
  hasOverrides: boolean;
  onVramChange: (v: number) => void;
  onRamChange: (v: number) => void;
  onResetOverride: () => void;
  showOverride: boolean;
  onToggleOverride: () => void;
  contextTokens: number;
  onContextChange: (tokens: number) => void;
  ollama: OllamaStatus | null;
  open: boolean;
  onClose: () => void;
  cloudHosted?: boolean;
  onEditHardware?: () => void;
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export function Sidebar({
  profile,
  loading,
  useCase,
  onUseCaseChange,
  family,
  onFamilyChange,
  onRescan,
  runnable,
  total,
  vramGB,
  ramGB,
  detectedVramGB,
  detectedRamGB,
  hasOverrides,
  onVramChange,
  onRamChange,
  onResetOverride,
  showOverride,
  onToggleOverride,
  contextTokens,
  onContextChange,
  ollama,
  open,
  onClose,
  cloudHosted = false,
  onEditHardware,
}: SidebarProps) {
  return (
    <>
      {open && (
        <button
          className="sidebar-overlay lg:hidden"
          onClick={onClose}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={`sidebar ${open ? "sidebar-open" : ""}`}
        aria-label="Navigation sidebar"
      >
        <div className="sidebar-inner">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="What Model logo"
              width={48}
              height={48}
              className="sidebar-brand-mark-img"
            />
            <div>
              <p className="font-display text-base text-[var(--text)]">
                What Model
              </p>
              <p className="font-data text-[0.5625rem] uppercase tracking-[0.15em] text-[var(--text-dim)]">
                Hardware profiler
              </p>
            </div>
          </div>

          {cloudHosted ? (
            <button
              onClick={onEditHardware}
              className="btn-primary w-full"
            >
              Edit hardware specs
            </button>
          ) : (
            <button
              onClick={onRescan}
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? "Scanning\u2026" : "Scan hardware"}
            </button>
          )}

          {!cloudHosted && (
            <div>
              <button
                onClick={onToggleOverride}
                className="sidebar-section-label flex w-full cursor-pointer items-center justify-between border-none bg-transparent hover:text-[var(--text-muted)]"
              >
                Override specs
                <span>{showOverride ? "\u2212" : "+"}</span>
              </button>
              {showOverride && (
                <div className="mt-2">
                  <SpecOverride
                    compact
                    vramGB={vramGB}
                    ramGB={ramGB}
                    detectedVramGB={detectedVramGB}
                    detectedRamGB={detectedRamGB}
                    hasOverrides={hasOverrides}
                    onVramChange={onVramChange}
                    onRamChange={onRamChange}
                    onReset={onResetOverride}
                  />
                </div>
              )}
            </div>
          )}

          <div className="border border-[var(--border)] bg-[var(--surface-raised)] p-3">
            <ContextSlider
              contextTokens={contextTokens}
              onChange={onContextChange}
            />
          </div>

          <div>
            <p className="sidebar-section-label">
              {cloudHosted ? "Your configuration" : "Your machine"}
            </p>
            <div>
              <div className="sidebar-stat">
                <span className="text-[var(--text-dim)]">RAM</span>
                <span className="sidebar-stat-value">
                  {cloudHosted ? `${ramGB} GB` : profile ? `${profile.ram.totalGB} GB` : "\u2014"}
                </span>
              </div>
              <div className="sidebar-stat">
                <span className="text-[var(--text-dim)]">VRAM</span>
                <span className="sidebar-stat-value">
                  {cloudHosted
                    ? vramGB > 0 ? `${vramGB} GB` : "N/A"
                    : profile
                      ? profile.usableVramGB > 0
                        ? `${profile.usableVramGB} GB`
                        : "N/A"
                      : "\u2014"}
                </span>
              </div>
              {!cloudHosted && profile && (
                <div className="sidebar-stat">
                  <span className="text-[var(--text-dim)]">Backend</span>
                  <span
                    className="sidebar-stat-value"
                    style={{ color: "var(--accent-bright)" }}
                  >
                    {BACKEND_LABELS[profile.computeBackend]}
                  </span>
                </div>
              )}
              {!loading && (
                <div className="sidebar-stat">
                  <span className="text-[var(--text-dim)]">Runnable</span>
                  <span className="sidebar-stat-value">
                    {runnable}
                    <span className="text-[var(--text-dim)]">/{total}</span>
                  </span>
                </div>
              )}
              {!cloudHosted && (
                <div className="sidebar-stat">
                  <span className="text-[var(--text-dim)]">Ollama</span>
                  <span
                    className="sidebar-stat-value"
                    style={{
                      color: ollama?.running
                        ? "var(--green)"
                        : ollama?.installed
                          ? "var(--amber)"
                          : "var(--text-dim)",
                    }}
                  >
                    {ollamaStatusLabel(ollama)}
                  </span>
                </div>
              )}
              {cloudHosted && (
                <div className="sidebar-stat">
                  <span className="text-[var(--text-dim)]">Mode</span>
                  <span
                    className="sidebar-stat-value"
                    style={{ color: "var(--amber)" }}
                  >
                    Cloud
                  </span>
                </div>
              )}
            </div>
          </div>

          <nav>
            <p className="sidebar-section-label">Go to</p>
            <ul>
              {NAV_ITEMS.map((item) => (
                <li key={item.id}>
                  <button
                    className="sidebar-nav-item"
                    onClick={() => {
                      scrollToSection(item.id);
                      onClose();
                    }}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="sidebar-section-label">Filter by task</p>
            <div>
              {USE_CASES.map((uc) => (
                <button
                  key={uc.id}
                  onClick={() => onUseCaseChange(uc.id)}
                  className={`sidebar-nav-item ${useCase === uc.id ? "sidebar-nav-item-active" : ""}`}
                >
                  {uc.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="sidebar-section-label">Filter by family</p>
            <div>
              {FAMILY_OPTIONS.map((f) => {
                const familyStyle =
                  f.id !== "all" ? getFamilyStyle(f.id) : null;
                const isActive = family === f.id;

                return (
                  <button
                    key={f.id}
                    onClick={() => onFamilyChange(f.id)}
                    className={`sidebar-nav-item sidebar-family-item ${isActive ? "sidebar-nav-item-active" : ""}`}
                    style={
                      isActive && familyStyle
                        ? { borderLeftColor: familyStyle.color }
                        : undefined
                    }
                  >
                    <FamilyNavContent
                      family={f.id}
                      label={f.label}
                      active={isActive}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
