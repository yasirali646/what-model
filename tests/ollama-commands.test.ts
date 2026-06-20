import { describe, it, expect } from "vitest";
import {
  formatOllamaTagForQuant,
  buildOllamaPullCommand,
  buildOllamaRunCommand,
} from "@/lib/ollama/tags";
import type { LocalModel } from "@/types";

function model(ollamaTag: string, overrides: Partial<LocalModel> = {}): LocalModel {
  return {
    id: "test",
    name: "Test",
    paramsB: 7,
    family: "llama",
    useCases: ["chat"],
    ollamaTag,
    ...overrides,
  };
}

describe("formatOllamaTagForQuant", () => {
  it("keeps base tag for Q4 instruct models", () => {
    expect(formatOllamaTagForQuant(model("qwen2.5:7b"), "Q4_K_M")).toBe(
      "qwen2.5:7b",
    );
    expect(formatOllamaTagForQuant(model("llama3.2:3b"), "Q4_K_M")).toBe(
      "llama3.2:3b",
    );
  });

  it("uses -instruct- quant suffix for higher quants", () => {
    expect(formatOllamaTagForQuant(model("qwen2.5:7b"), "Q8_0")).toBe(
      "qwen2.5:7b-instruct-q8_0",
    );
    expect(formatOllamaTagForQuant(model("llama3.2:3b"), "Q5_K_M")).toBe(
      "llama3.2:3b-instruct-q5_K_M",
    );
    expect(formatOllamaTagForQuant(model("llama3.1:8b"), "FP16")).toBe(
      "llama3.1:8b-instruct-fp16",
    );
  });

  it("uses family-specific quant patterns", () => {
    expect(formatOllamaTagForQuant(model("deepseek-r1:7b"), "Q8_0")).toBe(
      "deepseek-r1:7b-qwen-distill-q8_0",
    );
    expect(formatOllamaTagForQuant(model("mixtral:8x7b"), "Q8_0")).toBe(
      "mixtral:8x7b-instruct-v0.1-q8_0",
    );
    expect(formatOllamaTagForQuant(model("codestral:22b"), "Q5_K_M")).toBe(
      "codestral:22b-v0.1-q5_K_M",
    );
  });

  it("uses quant base for phi3 aliases", () => {
    expect(formatOllamaTagForQuant(model("phi3:mini"), "Q4_K_M")).toBe(
      "phi3:mini",
    );
    expect(formatOllamaTagForQuant(model("phi3:mini"), "Q8_0")).toBe(
      "phi3:3.8b-mini-4k-instruct-q8_0",
    );
  });

  it("keeps base tag for embedding models", () => {
    expect(
      formatOllamaTagForQuant(
        model("nomic-embed-text", {
          family: "nomic",
          useCases: ["embedding"],
          paramsB: 0.14,
        }),
        "Q8_0",
      ),
    ).toBe("nomic-embed-text");
  });
});

describe("buildOllamaPullCommand", () => {
  it("builds pull with quant-specific tag", () => {
    expect(buildOllamaPullCommand(model("mistral:7b"), "Q5_K_M")).toBe(
      "ollama pull mistral:7b-instruct-q5_K_M",
    );
    expect(buildOllamaPullCommand(model("llama3.2:3b"), "Q8_0")).toBe(
      "ollama pull llama3.2:3b-instruct-q8_0",
    );
  });
});

describe("buildOllamaRunCommand", () => {
  it("builds run with quant-specific tag", () => {
    expect(buildOllamaRunCommand(model("phi3:mini"), "Q4_K_M")).toBe(
      "ollama run phi3:mini",
    );
  });
});
