"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ModelRecommendation, SystemProfile, UseCase, ModelFamily, OllamaStatus } from "@/types";
import { DEFAULT_CONTEXT_TOKENS, formatContextLabel } from "@/lib/engine/vram";
import { pickTopModels } from "@/lib/engine/recommender";
import { SystemPanel } from "@/components/SystemPanel";
import { ModelCard } from "@/components/ModelCard";
import { ModelCompare } from "@/components/ModelCompare";
import { TopPicks } from "@/components/TopPicks";
import { Sidebar } from "@/components/Sidebar";
import { HardwareConfigModal } from "@/components/HardwareConfigModal";
import { CloudSystemPanel } from "@/components/CloudSystemPanel";
import { FaqSection } from "@/components/FaqSection";
import {
  isMobileOrTabletDevice,
  loadMobileDeviceConfig,
  saveMobileDeviceConfig,
} from "@/lib/device/isMobileDevice";

const DEFAULT_VRAM_GB = 0;
const DEFAULT_RAM_GB = 16;
const HW_CONFIG_STORAGE_KEY = "what-model-hw-config";

function loadHwConfig(): { vramGB: number; ramGB: number } | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(HW_CONFIG_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.vramGB === "number" && typeof parsed.ramGB === "number") {
      return parsed;
    }
  } catch { /* ignore */ }
  return null;
}

function saveHwConfig(vramGB: number, ramGB: number): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(HW_CONFIG_STORAGE_KEY, JSON.stringify({ vramGB, ramGB }));
}

export default function HomePage() {
  const [profile, setProfile] = useState<SystemProfile | null>(null);
  const [recommendations, setRecommendations] = useState<ModelRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useCase, setUseCase] = useState<UseCase | "all">("all");
  const [family, setFamily] = useState<ModelFamily | "all">("all");
  const [showOverride, setShowOverride] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vramOverride, setVramOverride] = useState<number | null>(null);
  const [ramOverride, setRamOverride] = useState<number | null>(null);
  const [compareLeftId, setCompareLeftId] = useState<string | null>(null);
  const [compareRightId, setCompareRightId] = useState<string | null>(null);
  const [contextTokens, setContextTokens] = useState(DEFAULT_CONTEXT_TOKENS);
  const [ollama, setOllama] = useState<OllamaStatus | null>(null);
  const [showHwConfig, setShowHwConfig] = useState(false);
  const [cloudHosted, setCloudHosted] = useState(false);
  const [configReady, setConfigReady] = useState(false);

  useEffect(() => {
    // On cloud, also check existing mobile config for backwards compat
    const saved = loadHwConfig() ?? loadMobileDeviceConfig();
    if (saved) {
      setVramOverride(saved.vramGB);
      setRamOverride(saved.ramGB);
      setConfigReady(true);
      return;
    }

    if (isMobileOrTabletDevice()) {
      setVramOverride(DEFAULT_VRAM_GB);
      setRamOverride(DEFAULT_RAM_GB);
      setShowHwConfig(true);
    }

    setConfigReady(true);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (useCase !== "all") params.set("useCase", useCase);
      if (family !== "all") params.set("family", family);
      if (vramOverride !== null) params.set("vramGB", String(vramOverride));
      if (ramOverride !== null) params.set("ramGB", String(ramOverride));
      params.set("contextTokens", String(contextTokens));

      const res = await fetch(`/api/recommend?${params}`);
      if (!res.ok) throw new Error("Failed to scan system");
      const data = await res.json();
      setProfile(data.profile);
      setRecommendations(data.recommendations);
      setOllama(data.ollama ?? null);
      if (data.contextTokens) setContextTokens(data.contextTokens);

      if (data.cloudHosted) {
        setCloudHosted(true);
        // First visit on cloud with no saved config: show modal
        const hasSaved = loadHwConfig() ?? loadMobileDeviceConfig();
        if (!hasSaved && !showHwConfig) {
          setVramOverride(DEFAULT_VRAM_GB);
          setRamOverride(DEFAULT_RAM_GB);
          setShowHwConfig(true);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [useCase, family, vramOverride, ramOverride, contextTokens, showHwConfig]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const runnable = recommendations.filter(
    (r) => r.fit !== "not_recommended",
  ).length;

  const detectedVramGB = profile?.usableVramGB ?? 0;
  const detectedRamGB = profile?.ram.usableGB ?? 16;
  const hasOverrides = vramOverride !== null || ramOverride !== null;

  const resetToDetected = useCallback(() => {
    setVramOverride(null);
    setRamOverride(null);
  }, []);

  const handleHwConfigSave = useCallback(
    (vramGB: number, ramGB: number) => {
      setVramOverride(vramGB);
      setRamOverride(ramGB);
      saveHwConfig(vramGB, ramGB);
      saveMobileDeviceConfig({ vramGB, ramGB });
      setShowHwConfig(false);
    },
    [],
  );

  const toggleCompare = useCallback((modelId: string) => {
    if (compareLeftId === modelId) {
      setCompareLeftId(null);
      return;
    }
    if (compareRightId === modelId) {
      setCompareRightId(null);
      return;
    }
    if (!compareLeftId) {
      setCompareLeftId(modelId);
      return;
    }
    if (!compareRightId) {
      setCompareRightId(modelId);
      return;
    }
    setCompareRightId(modelId);
  }, [compareLeftId, compareRightId]);

  const clearCompare = useCallback(() => {
    setCompareLeftId(null);
    setCompareRightId(null);
  }, []);

  const compareCount =
    (compareLeftId ? 1 : 0) + (compareRightId ? 1 : 0);

  const topPicks = useMemo(
    () => pickTopModels(recommendations, { max: 3, useCase }),
    [recommendations, useCase],
  );
  const topPickIds = useMemo(
    () => new Set(topPicks.map((p) => p.model.id)),
    [topPicks],
  );
  const otherModels = useMemo(
    () => recommendations.filter((r) => !topPickIds.has(r.model.id)),
    [recommendations, topPickIds],
  );

  return (
    <div className="flex min-h-screen">
      {configReady && showHwConfig && (
        <HardwareConfigModal
          initialVramGB={vramOverride ?? DEFAULT_VRAM_GB}
          initialRamGB={ramOverride ?? DEFAULT_RAM_GB}
          onSave={handleHwConfigSave}
          cloudHosted={cloudHosted}
        />
      )}

      <Sidebar
        profile={profile}
        loading={loading}
        useCase={useCase}
        onUseCaseChange={setUseCase}
        family={family}
        onFamilyChange={setFamily}
        onRescan={fetchData}
        runnable={runnable}
        total={recommendations.length}
        vramGB={vramOverride ?? detectedVramGB}
        ramGB={ramOverride ?? detectedRamGB}
        detectedVramGB={detectedVramGB}
        detectedRamGB={detectedRamGB}
        hasOverrides={hasOverrides}
        onVramChange={setVramOverride}
        onRamChange={setRamOverride}
        onResetOverride={resetToDetected}
        showOverride={showOverride}
        onToggleOverride={() => setShowOverride(!showOverride)}
        contextTokens={contextTokens}
        onContextChange={setContextTokens}
        ollama={ollama}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        cloudHosted={cloudHosted}
        onEditHardware={() => setShowHwConfig(true)}
      />

      <main id="main-content" className="main-content">
        <header className="hero animate-in">
          <div className="flex items-start gap-4">
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M1 4h14M1 8h14M1 12h14"
                  stroke="currentColor"
                  strokeWidth="1.25"
                />
              </svg>
            </button>
            <div>
              <p className="hero-eyebrow">Local inference profiler</p>
              <h1 className="hero-title">
                What can your machine actually run?
              </h1>
              <p className="hero-desc">
                {cloudHosted
                  ? "Enter your GPU and RAM specs, then see which open models fit, at what quantization, with ready-to-run Ollama commands."
                  : "Reads your CPU, memory, and GPU, then tells you which open models fit, at what quantization, with a ready-to-run Ollama command."}
              </p>
            </div>
          </div>
        </header>

        {error && <div className="error-banner mb-8">{error}</div>}

        {profile && (
          <section id="system" className="mb-14 scroll-mt-8">
            <h2 className="section-title">
              <span>01</span> / Hardware
            </h2>
            <p className="section-sub mb-5">
              {cloudHosted
                ? `Detected via browser · ${vramOverride ?? 0} GB VRAM · ${ramOverride ?? 16} GB RAM`
                : `${profile.os.release} · ${profile.os.arch}`}
            </p>
            {cloudHosted ? (
              <CloudSystemPanel
                vramGB={vramOverride ?? 0}
                ramGB={ramOverride ?? 16}
                onEditConfig={() => setShowHwConfig(true)}
              />
            ) : (
              <SystemPanel profile={profile} />
            )}
          </section>
        )}

        <section id="recommendations" className="scroll-mt-8">
          <h2 className="section-title">
            <span>02</span> / Models
          </h2>
          {!loading && (
            <p className="section-sub mb-6">
              {runnable} of {recommendations.length} models fit at{" "}
              {formatContextLabel(contextTokens)} context
              {compareCount > 0 && (
                <>
                  {" "}
                  · {compareCount}/2 selected for compare
                </>
              )}
            </p>
          )}

          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-52" />
              ))}
            </div>
          ) : (
            <>
              <TopPicks
                picks={topPicks}
                pulledModels={ollama?.models ?? []}
                compareLeftId={compareLeftId}
                compareRightId={compareRightId}
                onCompareToggle={toggleCompare}
              />

              {otherModels.length > 0 && (
                <>
                  {topPicks.length > 0 && (
                    <p className="stat-block-label mb-3">All models</p>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {otherModels.map((rec, i) => (
                      <div
                        key={rec.model.id}
                        className="animate-in"
                        style={{
                          animationDelay: `${Math.min(i * 0.03, 0.3)}s`,
                        }}
                      >
                        <ModelCard
                          rec={rec}
                          pulledModels={ollama?.models ?? []}
                          compareSelected={
                            compareLeftId === rec.model.id ||
                            compareRightId === rec.model.id
                          }
                          onCompareToggle={() => toggleCompare(rec.model.id)}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </section>

        {!loading && recommendations.length > 0 && (
          <section id="compare" className="scroll-mt-8" aria-label="Compare models">
            <ModelCompare
              recommendations={recommendations}
              leftId={compareLeftId}
              rightId={compareRightId}
              onLeftChange={setCompareLeftId}
              onRightChange={setCompareRightId}
              onClear={clearCompare}
            />
          </section>
        )}

        <FaqSection />

        <footer className="mt-20 border-t border-[var(--border)] pt-6">
          <p className="font-data text-[0.625rem] leading-relaxed text-[var(--text-dim)]">
            Memory estimates are approximate. Actual usage depends on your
            runtime (Ollama, llama.cpp, or LM Studio).
            {cloudHosted
              ? " For best results, run this tool locally on the machine you want to inference on."
              : " Run this tool locally on the machine you want to inference on."}
          </p>
        </footer>
      </main>
    </div>
  );
}
