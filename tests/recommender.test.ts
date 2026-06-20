import { describe, it, expect } from "vitest";
import { recommendModels, pickTopModels } from "@/lib/engine/recommender";
import type { SystemProfile } from "@/types";

function makeProfile(overrides: Partial<SystemProfile> = {}): SystemProfile {
  return {
    os: {
      platform: "linux",
      arch: "x64",
      release: "Ubuntu 24.04",
      hostname: "test",
    },
    cpu: {
      manufacturer: "Intel",
      brand: "Intel Core i7",
      cores: 8,
      threads: 16,
      speedGHz: 3.5,
    },
    ram: { totalGB: 32, freeGB: 16, usableGB: 20.8 },
    gpus: [
      {
        vendor: "NVIDIA",
        model: "RTX 4070",
        vramMB: 12288,
        vramDynamic: false,
      },
    ],
    computeBackend: "nvidia_cuda",
    totalVramGB: 12,
    usableVramGB: 10.8,
    multiGpu: false,
    detectionWarnings: [],
    ...overrides,
  };
}

describe("recommendModels", () => {
  it("recommends 8B as strong or recommendation on 12GB GPU", () => {
    const recs = recommendModels(makeProfile());
    const llama8b = recs.find((r) => r.model.id === "llama-3.1-8b");
    expect(llama8b).toBeDefined();
    expect(["strong_recommendation", "recommendation"]).toContain(llama8b!.fit);
  });

  it("marks 70B as not recommended on 12GB GPU", () => {
    const recs = recommendModels(makeProfile());
    const llama70b = recs.find((r) => r.model.id === "llama-3.1-70b");
    expect(llama70b).toBeDefined();
    expect(["not_recommended", "normal"]).toContain(llama70b!.fit);
  });

  it("filters by use case", () => {
    const recs = recommendModels(makeProfile(), { useCase: "coding" });
    expect(recs.every((r) => r.model.useCases.includes("coding"))).toBe(true);
  });

  it("filters by family", () => {
    const recs = recommendModels(makeProfile(), { family: "qwen" });
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.every((r) => r.model.family === "qwen")).toBe(true);
  });

  it("filters by embedding use case", () => {
    const recs = recommendModels(makeProfile(), { useCase: "embedding" });
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.every((r) => r.model.useCases.includes("embedding"))).toBe(
      true,
    );
  });

  it("respects VRAM override", () => {
    const recs = recommendModels(makeProfile(), {
      profileOverride: { usableVramGB: 48 },
    });
    const llama70b = recs.find((r) => r.model.id === "llama-3.1-70b");
    expect(llama70b).toBeDefined();
    expect([
      "strong_recommendation",
      "recommendation",
      "normal",
    ]).toContain(llama70b!.fit);
  });

  it("sorts strong recommendations before not recommended", () => {
    const recs = recommendModels(makeProfile());
    const firstNotRecommended = recs.findIndex(
      (r) => r.fit === "not_recommended",
    );
    const lastStrong = recs.findLastIndex(
      (r) => r.fit === "strong_recommendation",
    );
    if (firstNotRecommended >= 0 && lastStrong >= 0) {
      expect(lastStrong).toBeLessThan(firstNotRecommended);
    }
  });

  it("includes quantization breakdown on each recommendation", () => {
    const recs = recommendModels(makeProfile());
    const llama8b = recs.find((r) => r.model.id === "llama-3.1-8b");
    expect(llama8b?.quantizationBreakdown).toHaveLength(4);
    expect(llama8b?.quantizationBreakdown.some((q) => q.fits)).toBe(true);
  });

  it("marks pulled Ollama models", () => {
    const recs = recommendModels(makeProfile(), {
      ollama: {
        installed: true,
        running: true,
        models: ["llama3.1:8b"],
      },
    });
    const llama8b = recs.find((r) => r.model.id === "llama-3.1-8b");
    expect(llama8b?.ollamaPulled).toBe(true);
    expect(llama8b?.ollamaRunCommand).toBe(
      "ollama run llama3.1:8b-instruct-q8_0",
    );
  });

  it("tightens fit at longer context", () => {
    const short = recommendModels(makeProfile(), { contextTokens: 4096 });
    const long = recommendModels(makeProfile(), { contextTokens: 32768 });
    const short14b = short.find((r) => r.model.id === "qwen2.5-14b")!;
    const long14b = long.find((r) => r.model.id === "qwen2.5-14b")!;
    const shortQ4 = short14b.quantizationBreakdown.find(
      (q) => q.quantization === "Q4_K_M",
    )!;
    const longQ4 = long14b.quantizationBreakdown.find(
      (q) => q.quantization === "Q4_K_M",
    )!;
    expect(longQ4.totalGB).toBeGreaterThan(shortQ4.totalGB);
  });
});

describe("pickTopModels", () => {
  it("returns up to 3 runnable models", () => {
    const recs = recommendModels(makeProfile());
    const picks = pickTopModels(recs, { max: 3 });
    expect(picks.length).toBeGreaterThan(0);
    expect(picks.length).toBeLessThanOrEqual(3);
    expect(picks.every((r) => r.fit !== "not_recommended")).toBe(true);
  });

  it("excludes embedding-only models when use case is all", () => {
    const recs = recommendModels(makeProfile());
    const picks = pickTopModels(recs, { max: 3, useCase: "all" });
    expect(
      picks.every((r) => !r.model.useCases.every((uc) => uc === "embedding")),
    ).toBe(true);
    expect(picks.some((r) => r.model.paramsB >= 1)).toBe(true);
  });

  it("prefers better fit tier over larger params", () => {
    const recs = recommendModels(makeProfile());
    const picks = pickTopModels(recs, { max: 3 });
    const fitOrder = [
      "strong_recommendation",
      "recommendation",
      "normal",
      "not_recommended",
    ];
    for (let i = 1; i < picks.length; i++) {
      const prev = fitOrder.indexOf(picks[i - 1].fit);
      const curr = fitOrder.indexOf(picks[i].fit);
      expect(prev).toBeLessThanOrEqual(curr);
    }
  });

  it("respects active use case filter", () => {
    const recs = recommendModels(makeProfile(), { useCase: "embedding" });
    const picks = pickTopModels(recs, { max: 3, useCase: "embedding" });
    expect(picks.every((r) => r.model.useCases.includes("embedding"))).toBe(
      true,
    );
  });
});
