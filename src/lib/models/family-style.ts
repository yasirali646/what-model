import type { ModelFamily } from "@/types";

export interface FamilyStyle {
  color: string;
  bg: string;
  border: string;
}

export const FAMILY_STYLES: Record<ModelFamily, FamilyStyle> = {
  llama: {
    color: "#6eb0f2",
    bg: "rgba(110, 176, 242, 0.12)",
    border: "rgba(110, 176, 242, 0.35)",
  },
  mistral: {
    color: "#ff9f5a",
    bg: "rgba(255, 159, 90, 0.12)",
    border: "rgba(255, 159, 90, 0.35)",
  },
  qwen: {
    color: "#b48cff",
    bg: "rgba(180, 140, 255, 0.12)",
    border: "rgba(180, 140, 255, 0.35)",
  },
  deepseek: {
    color: "#3dd6b5",
    bg: "rgba(61, 214, 181, 0.12)",
    border: "rgba(61, 214, 181, 0.35)",
  },
  phi: {
    color: "#8b93ff",
    bg: "rgba(139, 147, 255, 0.12)",
    border: "rgba(139, 147, 255, 0.35)",
  },
  gemma: {
    color: "#f472b6",
    bg: "rgba(244, 114, 182, 0.12)",
    border: "rgba(244, 114, 182, 0.35)",
  },
  nomic: {
    color: "#6dd47a",
    bg: "rgba(109, 212, 122, 0.12)",
    border: "rgba(109, 212, 122, 0.35)",
  },
  bge: {
    color: "#e8c547",
    bg: "rgba(232, 197, 71, 0.12)",
    border: "rgba(232, 197, 71, 0.35)",
  },
  mxbai: {
    color: "#5cd4f0",
    bg: "rgba(92, 212, 240, 0.12)",
    border: "rgba(92, 212, 240, 0.35)",
  },
  snowflake: {
    color: "#b8c4d4",
    bg: "rgba(184, 196, 212, 0.12)",
    border: "rgba(184, 196, 212, 0.35)",
  },
};

export function getFamilyStyle(family: ModelFamily): FamilyStyle {
  return FAMILY_STYLES[family];
}
