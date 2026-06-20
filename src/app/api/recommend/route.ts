import { NextRequest, NextResponse } from "next/server";
import { detectSystem } from "@/lib/hardware/detector";
import { recommendModels } from "@/lib/engine/recommender";
import { detectOllama } from "@/lib/ollama/client";
import { MODEL_FAMILIES } from "@/lib/models/catalog";
import {
  clampContextTokens,
  DEFAULT_CONTEXT_TOKENS,
} from "@/lib/engine/vram";
import { isCloudHosted } from "@/lib/env/cloud";
import type { SystemProfile, UseCase, ModelFamily } from "@/types";

export const dynamic = "force-dynamic";

const VALID_USE_CASES: UseCase[] = [
  "chat",
  "coding",
  "reasoning",
  "vision",
  "embedding",
];

function makePlaceholderProfile(vramGB: number, ramGB: number): SystemProfile {
  return {
    os: {
      platform: "cloud",
      arch: "x86_64",
      release: "Cloud hosted",
      hostname: "cloud",
    },
    cpu: {
      manufacturer: "",
      brand: "Cloud hosted",
      cores: 0,
      threads: 0,
      speedGHz: 0,
    },
    ram: {
      totalGB: ramGB,
      freeGB: ramGB,
      usableGB: ramGB,
    },
    gpus: vramGB > 0
      ? [{ vendor: "User configured", model: "User configured", vramMB: vramGB * 1024, vramDynamic: false }]
      : [],
    computeBackend: vramGB > 0 ? "nvidia_cuda" : "cpu_only",
    totalVramGB: vramGB,
    usableVramGB: vramGB,
    multiGpu: false,
    detectionWarnings: [],
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const useCaseParam = searchParams.get("useCase");
    const familyParam = searchParams.get("family");
    const maxResults = parseInt(searchParams.get("maxResults") ?? "50", 10);

    const vramOverride = searchParams.get("vramGB");
    const ramOverride = searchParams.get("ramGB");
    const contextParam = searchParams.get("contextTokens");
    const contextTokens = contextParam
      ? clampContextTokens(parseInt(contextParam, 10))
      : DEFAULT_CONTEXT_TOKENS;

    let useCase: UseCase | undefined;
    if (useCaseParam && VALID_USE_CASES.includes(useCaseParam as UseCase)) {
      useCase = useCaseParam as UseCase;
    }

    let family: ModelFamily | undefined;
    if (familyParam && MODEL_FAMILIES.includes(familyParam as ModelFamily)) {
      family = familyParam as ModelFamily;
    }

    const cloud = isCloudHosted();

    let profile: SystemProfile;
    let ollama;

    if (cloud) {
      const vram = vramOverride ? parseFloat(vramOverride) : 0;
      const ram = ramOverride ? parseFloat(ramOverride) : 16;
      profile = makePlaceholderProfile(
        isNaN(vram) || vram < 0 ? 0 : vram,
        isNaN(ram) || ram < 0 ? 16 : ram,
      );
      ollama = { installed: false, running: false, models: [] };
    } else {
      [profile, ollama] = await Promise.all([
        detectSystem(),
        detectOllama(),
      ]);
    }

    const profileOverride: {
      usableVramGB?: number;
      usableRamGB?: number;
    } = {};

    if (!cloud && vramOverride) {
      const v = parseFloat(vramOverride);
      if (!isNaN(v) && v >= 0) profileOverride.usableVramGB = v;
    }
    if (!cloud && ramOverride) {
      const r = parseFloat(ramOverride);
      if (!isNaN(r) && r >= 0) profileOverride.usableRamGB = r;
    }

    const recommendations = recommendModels(profile, {
      useCase,
      family,
      maxResults,
      contextTokens,
      ollama,
      profileOverride:
        Object.keys(profileOverride).length > 0 ? profileOverride : undefined,
    });

    return NextResponse.json({
      profile,
      recommendations,
      ollama,
      contextTokens,
      cloudHosted: cloud,
      filters: { useCase: useCase ?? "all", family: family ?? "all" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate recommendations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
