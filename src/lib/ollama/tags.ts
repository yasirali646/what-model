import type { LocalModel, OllamaQuantStyle, Quantization } from "@/types";

export function normalizeOllamaTag(tag: string): string {
  return tag.replace(/:latest$/i, "").toLowerCase();
}

const QUANT_OLLAMA_SUFFIX: Record<Quantization, string> = {
  Q4_K_M: "q4_K_M",
  Q5_K_M: "q5_K_M",
  Q8_0: "q8_0",
  FP16: "fp16",
};

const STYLE_INFIX: Record<OllamaQuantStyle, string | null> = {
  instruct: "-instruct-",
  none: null,
  distill: "-qwen-distill-",
  "instruct-v0.1": "-instruct-v0.1-",
  "v0.1": "-v0.1-",
  "instruct-2407": "-instruct-2407-",
  "lite-chat": "-lite-chat-",
  "lite-base": "-lite-base-",
};

function isEmbeddingModel(model: LocalModel): boolean {
  return (
    model.useCases.length === 1 && model.useCases[0] === "embedding"
  );
}

export function resolveOllamaQuantStyle(model: LocalModel): OllamaQuantStyle {
  if (model.ollamaQuantStyle) return model.ollamaQuantStyle;
  if (isEmbeddingModel(model)) return "none";
  const tag = model.ollamaTag ?? "";
  if (tag.startsWith("deepseek-r1:")) return "distill";
  if (tag.startsWith("deepseek-v2:")) return "lite-chat";
  if (tag.startsWith("deepseek-coder-v2:")) return "lite-base";
  if (tag.startsWith("mixtral:")) return "instruct-v0.1";
  if (tag.startsWith("codestral:")) return "v0.1";
  if (tag.startsWith("mistral-nemo:")) return "instruct-2407";
  return "instruct";
}

export function resolveOllamaQuantBase(model: LocalModel): string {
  if (model.ollamaQuantBase) return model.ollamaQuantBase;
  const tag = model.ollamaTag ?? "";
  if (tag === "phi3:mini") return "phi3:3.8b-mini-4k";
  if (tag === "phi3:medium") return "phi3:14b-medium-4k";
  return tag;
}

export function formatOllamaTagForQuant(
  model: LocalModel,
  quant: Quantization,
): string {
  const baseTag = model.ollamaTag;
  if (!baseTag) return "";

  const style = resolveOllamaQuantStyle(model);
  if (style === "none") return baseTag;

  // Default Ollama tags resolve to Q4 instruct weights
  if (quant === "Q4_K_M") return baseTag;

  const infix = STYLE_INFIX[style];
  if (!infix) return baseTag;

  const quantBase = resolveOllamaQuantBase(model);
  return `${quantBase}${infix}${QUANT_OLLAMA_SUFFIX[quant]}`;
}

export function isOllamaModelPulled(
  ollamaTag: string | undefined,
  pulledModels: string[],
  model?: LocalModel,
): boolean {
  if (!ollamaTag) return false;
  const normalized = normalizeOllamaTag(ollamaTag);
  return pulledModels.some((m) => {
    const pulled = normalizeOllamaTag(m);
    if (pulled === normalized || pulled.startsWith(`${normalized}:`)) {
      return true;
    }
    if (!model?.ollamaTag) return false;
    const catalogBase = normalizeOllamaTag(model.ollamaTag);
    const q4Suffix = normalizeOllamaTag(
      QUANT_OLLAMA_SUFFIX.Q4_K_M,
    );
    // Base tag matches an explicit Q4 variant, and vice versa
    if (normalized === catalogBase) {
      const quantBase = normalizeOllamaTag(resolveOllamaQuantBase(model));
      return (
        pulled === catalogBase ||
        (pulled.startsWith(`${quantBase}-`) && pulled.endsWith(`-${q4Suffix}`))
      );
    }
    if (normalized.endsWith(`-${q4Suffix}`) && pulled === catalogBase) {
      return true;
    }
    return false;
  });
}

export function buildOllamaPullCommand(
  model: LocalModel,
  quant: Quantization,
): string {
  return `ollama pull ${formatOllamaTagForQuant(model, quant)}`;
}

export function buildOllamaRunCommand(
  model: LocalModel,
  quant: Quantization,
): string {
  return `ollama run ${formatOllamaTagForQuant(model, quant)}`;
}
