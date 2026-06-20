import { MODEL_CATALOG } from "@/lib/models/catalog";
import {
  findBestQuantization,
  estimateVram,
  estimateAllQuantizations,
  QUANTIZATION_ORDER,
  DEFAULT_CONTEXT_TOKENS,
} from "@/lib/engine/vram";
import {
  buildOllamaPullCommand,
  buildOllamaRunCommand,
  isOllamaModelPulled,
} from "@/lib/ollama/tags";
import type {
  FitTier,
  LocalModel,
  ModelRecommendation,
  QuantFitEntry,
  RecommendOptions,
  SystemProfile,
  UseCase,
  ModelFamily,
  Quantization,
} from "@/types";

const FIT_ORDER: Record<FitTier, number> = {
  strong_recommendation: 0,
  recommendation: 1,
  normal: 2,
  not_recommended: 3,
};

function computeFit(
  neededGB: number,
  availableGB: number,
): { fit: FitTier; headroomPercent: number } {
  if (availableGB <= 0 || neededGB > availableGB) {
    return { fit: "not_recommended", headroomPercent: 0 };
  }

  const headroomPercent = ((availableGB - neededGB) / availableGB) * 100;

  if (headroomPercent >= 20) {
    return { fit: "strong_recommendation", headroomPercent };
  }
  if (headroomPercent >= 10) {
    return { fit: "recommendation", headroomPercent };
  }
  return { fit: "normal", headroomPercent };
}

function computeQuantBreakdown(
  paramsB: number,
  gpuBudgetGB: number,
  ramBudgetGB: number,
  contextTokens: number,
): QuantFitEntry[] {
  return estimateAllQuantizations(paramsB, contextTokens).map((est) => ({
    quantization: est.quantization,
    totalGB: est.totalGB,
    fits: est.totalGB <= gpuBudgetGB || est.totalGB <= ramBudgetGB,
  }));
}

function pickBestQuantizationForModel(
  model: LocalModel,
  gpuBudgetGB: number,
  ramBudgetGB: number,
  contextTokens: number,
): { quantization: Quantization; memoryGB: number; source: "gpu" | "ram" } | null {
  const paramsB = model.paramsB;

  const gpuQuant = findBestQuantization(paramsB, gpuBudgetGB, contextTokens);
  if (gpuQuant) {
    return {
      quantization: gpuQuant,
      memoryGB: estimateVram(paramsB, gpuQuant, contextTokens).totalGB,
      source: "gpu",
    };
  }

  const ramQuant = findBestQuantization(paramsB, ramBudgetGB, contextTokens);
  if (ramQuant) {
    return {
      quantization: ramQuant,
      memoryGB: estimateVram(paramsB, ramQuant, contextTokens).totalGB,
      source: "ram",
    };
  }

  const smallest = estimateVram(paramsB, "Q4_K_M", contextTokens).totalGB;
  if (smallest <= ramBudgetGB) {
    return { quantization: "Q4_K_M", memoryGB: smallest, source: "ram" };
  }

  return null;
}

function recommendModel(
  model: LocalModel,
  profile: SystemProfile,
  contextTokens: number,
  pulledModels: string[],
): ModelRecommendation {
  const gpuBudget = profile.usableVramGB;
  const ramBudget = profile.ram.usableGB;
  const notes: string[] = [];
  const quantizationBreakdown = computeQuantBreakdown(
    model.paramsB,
    gpuBudget,
    ramBudget,
    contextTokens,
  );
  const ollamaPulled = isOllamaModelPulled(
    model.ollamaTag,
    pulledModels,
    model,
  );

  if (model.activeParamsB) {
    notes.push(
      `MoE: ${model.activeParamsB}B active of ${model.paramsB}B total parameters`,
    );
  }

  const pick = pickBestQuantizationForModel(
    model,
    gpuBudget,
    ramBudget,
    contextTokens,
  );

  if (!pick) {
    const minNeeded = estimateVram(model.paramsB, "Q4_K_M", contextTokens)
      .totalGB;
    return {
      model,
      fit: "not_recommended",
      bestQuantization: "Q4_K_M",
      estimatedMemoryGB: minNeeded,
      memorySource: "ram",
      headroomPercent: 0,
      quantizationBreakdown,
      ollamaPulled,
      ollamaCommand: model.ollamaTag
        ? buildOllamaPullCommand(model, "Q4_K_M")
        : undefined,
      ollamaRunCommand: model.ollamaTag
        ? buildOllamaRunCommand(model, "Q4_K_M")
        : undefined,
      notes: [
        ...notes,
        `Needs at least ~${minNeeded} GB; you have ${gpuBudget.toFixed(1)} GB GPU / ${ramBudget.toFixed(1)} GB usable RAM`,
      ],
    };
  }

  let fit: FitTier;
  let headroomPercent: number;
  const budget = pick.source === "gpu" ? gpuBudget : ramBudget;
  const { fit: computedFit, headroomPercent: hr } = computeFit(
    pick.memoryGB,
    budget,
  );

  if (pick.source === "ram" && gpuBudget > 0 && pick.memoryGB > gpuBudget) {
    fit = "normal";
    headroomPercent = ((ramBudget - pick.memoryGB) / ramBudget) * 100;
    notes.push("Exceeds GPU VRAM. Will run on CPU/RAM (significantly slower)");
  } else if (pick.source === "ram" && profile.computeBackend === "cpu_only") {
    fit = computedFit === "not_recommended" ? "not_recommended" : "normal";
    headroomPercent = hr;
    notes.push("No discrete GPU detected. CPU inference only");
  } else {
    fit = computedFit;
    headroomPercent = hr;
  }

  if (
    model.minRamGB &&
    pick.source === "ram" &&
    ramBudget < model.minRamGB
  ) {
    fit = "not_recommended";
    notes.push(`Requires at least ${model.minRamGB} GB system RAM`);
  }

  return {
    model,
    fit,
    bestQuantization: pick.quantization,
    estimatedMemoryGB: pick.memoryGB,
    memorySource: pick.source,
    headroomPercent: Math.round(headroomPercent),
    quantizationBreakdown,
    ollamaPulled,
    ollamaCommand: model.ollamaTag
      ? buildOllamaPullCommand(model, pick.quantization)
      : undefined,
    ollamaRunCommand: model.ollamaTag
      ? buildOllamaRunCommand(model, pick.quantization)
      : undefined,
    notes,
  };
}

function useCaseMatch(model: LocalModel, useCase?: UseCase): boolean {
  if (!useCase) return true;
  return model.useCases.includes(useCase);
}

function familyMatch(model: LocalModel, family?: ModelFamily): boolean {
  if (!family) return true;
  return model.family === family;
}

export function recommendModels(
  profile: SystemProfile,
  options: RecommendOptions = {},
): ModelRecommendation[] {
  const {
    useCase,
    family,
    maxResults = 50,
    profileOverride,
    contextTokens = DEFAULT_CONTEXT_TOKENS,
    ollama,
  } = options;

  const pulledModels = ollama?.models ?? [];

  const effectiveProfile: SystemProfile = {
    ...profile,
    usableVramGB: profileOverride?.usableVramGB ?? profile.usableVramGB,
    ram: {
      ...profile.ram,
      usableGB: profileOverride?.usableRamGB ?? profile.ram.usableGB,
    },
  };

  const recommendations = MODEL_CATALOG.filter(
    (m) => useCaseMatch(m, useCase) && familyMatch(m, family),
  )
    .map((m) =>
      recommendModel(m, effectiveProfile, contextTokens, pulledModels),
    )
    .sort((a, b) => {
      const fitDiff = FIT_ORDER[a.fit] - FIT_ORDER[b.fit];
      if (fitDiff !== 0) return fitDiff;
      return b.model.paramsB - a.model.paramsB;
    });

  return recommendations.slice(0, maxResults);
}

const GENERATIVE_USE_CASES: UseCase[] = [
  "chat",
  "coding",
  "reasoning",
  "vision",
];

function isGenerativeModel(model: LocalModel): boolean {
  return model.useCases.some((uc) => GENERATIVE_USE_CASES.includes(uc));
}

export function pickTopModels(
  recommendations: ModelRecommendation[],
  options: { max?: number; useCase?: UseCase | "all" } = {},
): ModelRecommendation[] {
  const { max = 3, useCase = "all" } = options;

  let candidates = recommendations.filter((r) => r.fit !== "not_recommended");

  if (useCase !== "embedding") {
    const generative = candidates.filter((r) => isGenerativeModel(r.model));
    if (generative.length > 0) candidates = generative;
  }

  return candidates
    .sort((a, b) => {
      const fitDiff = FIT_ORDER[a.fit] - FIT_ORDER[b.fit];
      if (fitDiff !== 0) return fitDiff;
      const headroomDiff = b.headroomPercent - a.headroomPercent;
      if (headroomDiff !== 0) return headroomDiff;
      return b.model.paramsB - a.model.paramsB;
    })
    .slice(0, max);
}

export function getQuantizationLabel(q: Quantization): string {
  return q.replace("_", " ");
}

export { QUANTIZATION_ORDER };
