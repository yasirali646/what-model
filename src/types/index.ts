export type ComputeBackend =
  | "nvidia_cuda"
  | "apple_metal"
  | "amd_rocm"
  | "cpu_only";

export type Quantization = "Q4_K_M" | "Q5_K_M" | "Q8_0" | "FP16";

/** How Ollama names quant variants for a model family */
export type OllamaQuantStyle =
  | "instruct"
  | "none"
  | "distill"
  | "instruct-v0.1"
  | "v0.1"
  | "instruct-2407"
  | "lite-chat"
  | "lite-base";

export type UseCase = "chat" | "coding" | "reasoning" | "vision" | "embedding";

export type ModelFamily =
  | "llama"
  | "mistral"
  | "qwen"
  | "deepseek"
  | "phi"
  | "gemma"
  | "nomic"
  | "bge"
  | "mxbai"
  | "snowflake";

export type FitTier =
  | "strong_recommendation"
  | "recommendation"
  | "normal"
  | "not_recommended";

export interface GpuInfo {
  vendor: string;
  model: string;
  vramMB: number;
  vramDynamic: boolean;
  memoryUsedMB?: number;
  memoryFreeMB?: number;
}

export interface SystemProfile {
  os: {
    platform: string;
    arch: string;
    release: string;
    hostname: string;
  };
  cpu: {
    manufacturer: string;
    brand: string;
    cores: number;
    threads: number;
    speedGHz: number;
  };
  ram: {
    totalGB: number;
    freeGB: number;
    usableGB: number;
  };
  gpus: GpuInfo[];
  computeBackend: ComputeBackend;
  totalVramGB: number;
  usableVramGB: number;
  multiGpu: boolean;
  detectionWarnings: string[];
}

export interface LocalModel {
  id: string;
  name: string;
  paramsB: number;
  activeParamsB?: number;
  family: ModelFamily;
  useCases: UseCase[];
  ollamaTag?: string;
  /** Base name for quant-specific tags when it differs from ollamaTag (e.g. phi3:mini) */
  ollamaQuantBase?: string;
  /** Override auto-detected Ollama quant naming pattern */
  ollamaQuantStyle?: OllamaQuantStyle;
  minRamGB?: number;
  description?: string;
}

export interface VramEstimate {
  quantization: Quantization;
  weightsGB: number;
  kvCacheGB: number;
  totalGB: number;
}

export interface QuantFitEntry {
  quantization: Quantization;
  totalGB: number;
  fits: boolean;
}

export interface ModelRecommendation {
  model: LocalModel;
  fit: FitTier;
  bestQuantization: Quantization;
  estimatedMemoryGB: number;
  memorySource: "gpu" | "ram";
  headroomPercent: number;
  quantizationBreakdown: QuantFitEntry[];
  ollamaCommand?: string;
  ollamaRunCommand?: string;
  ollamaPulled: boolean;
  notes: string[];
}

export interface OllamaStatus {
  installed: boolean;
  running: boolean;
  models: string[];
}

export interface RecommendOptions {
  useCase?: UseCase;
  family?: ModelFamily;
  maxResults?: number;
  contextTokens?: number;
  profileOverride?: {
    usableVramGB?: number;
    usableRamGB?: number;
  };
  ollama?: OllamaStatus;
}
