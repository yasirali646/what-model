import type { Quantization, VramEstimate } from "@/types";

export const BYTES_PER_PARAM: Record<Quantization, number> = {
  Q4_K_M: 0.55,
  Q5_K_M: 0.7,
  Q8_0: 1.0,
  FP16: 2.0,
};

export const QUANTIZATION_ORDER: Quantization[] = [
  "Q4_K_M",
  "Q5_K_M",
  "Q8_0",
  "FP16",
];

export const CONTEXT_PRESETS = [4096, 8192, 16384, 32768] as const;

export const DEFAULT_CONTEXT_TOKENS = 8192;

export function formatContextLabel(tokens: number): string {
  if (tokens >= 1024) return `${tokens / 1024}K`;
  return `${tokens}`;
}

const SHORT_QUANT_LABELS: Record<Quantization, string> = {
  Q4_K_M: "Q4",
  Q5_K_M: "Q5",
  Q8_0: "Q8",
  FP16: "FP16",
};

export function getShortQuantLabel(q: Quantization): string {
  return SHORT_QUANT_LABELS[q];
}

export function clampContextTokens(tokens: number): number {
  const preset = CONTEXT_PRESETS.find((p) => p === tokens);
  if (preset) return preset;
  return CONTEXT_PRESETS.reduce((prev, curr) =>
    Math.abs(curr - tokens) < Math.abs(prev - tokens) ? curr : prev,
  );
}
const OVERHEAD_MULTIPLIER = 1.1;

function estimateKvCacheGB(paramsB: number, contextTokens: number): number {
  const layers = Math.round(Math.min(80, Math.max(24, paramsB * 3.5)));
  const kvPerTokenMB = (layers * 128 * 2 * 2) / (1024 * 1024);
  const kvGB = (kvPerTokenMB * contextTokens) / 1024;
  return Math.max(0.5, Math.min(kvGB, paramsB * 0.5));
}

export function estimateVram(
  paramsB: number,
  quantization: Quantization,
  contextTokens = DEFAULT_CONTEXT_TOKENS,
): VramEstimate {
  const weightsGB = paramsB * BYTES_PER_PARAM[quantization];
  const kvCacheGB = estimateKvCacheGB(paramsB, contextTokens);
  const totalGB = (weightsGB + kvCacheGB) * OVERHEAD_MULTIPLIER;

  return {
    quantization,
    weightsGB: Math.round(weightsGB * 10) / 10,
    kvCacheGB: Math.round(kvCacheGB * 10) / 10,
    totalGB: Math.round(totalGB * 10) / 10,
  };
}

export function estimateAllQuantizations(
  paramsB: number,
  contextTokens = DEFAULT_CONTEXT_TOKENS,
): VramEstimate[] {
  return QUANTIZATION_ORDER.map((q) => estimateVram(paramsB, q, contextTokens));
}

export function findBestQuantization(
  paramsB: number,
  availableGB: number,
  contextTokens = DEFAULT_CONTEXT_TOKENS,
): Quantization | null {
  for (const q of [...QUANTIZATION_ORDER].reverse()) {
    const est = estimateVram(paramsB, q, contextTokens);
    if (est.totalGB <= availableGB) {
      return q;
    }
  }
  return null;
}
