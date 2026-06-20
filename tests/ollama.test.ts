import { describe, it, expect } from "vitest";
import {
  isOllamaModelPulled,
  normalizeOllamaTag,
} from "@/lib/ollama/tags";

describe("normalizeOllamaTag", () => {
  it("lowercases and strips :latest", () => {
    expect(normalizeOllamaTag("Llama3.1:8B:latest")).toBe("llama3.1:8b");
  });
});

describe("isOllamaModelPulled", () => {
  const pulled = ["llama3.1:8b", "qwen2.5:7b", "phi3:mini"];

  it("returns false when tag is undefined", () => {
    expect(isOllamaModelPulled(undefined, pulled)).toBe(false);
  });

  it("matches exact tag", () => {
    expect(isOllamaModelPulled("qwen2.5:7b", pulled)).toBe(true);
  });

  it("matches tag with :latest suffix in catalog", () => {
    expect(isOllamaModelPulled("llama3.1:8b:latest", pulled)).toBe(true);
  });

  it("returns false for unpulled model", () => {
    expect(isOllamaModelPulled("mistral:7b", pulled)).toBe(false);
  });

  it("matches base tag to explicit Q4 variant", () => {
    const llama = {
      id: "llama-3.2-3b",
      name: "Llama 3.2 3B",
      paramsB: 3,
      family: "llama" as const,
      useCases: ["chat" as const],
      ollamaTag: "llama3.2:3b",
    };
    expect(
      isOllamaModelPulled(
        "llama3.2:3b",
        ["llama3.2:3b-instruct-q4_K_M"],
        llama,
      ),
    ).toBe(true);
  });
});
