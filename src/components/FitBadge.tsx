import type { FitTier } from "@/types";

const FIT_CONFIG: Record<
  FitTier,
  { label: string; color: string }
> = {
  strong_recommendation: {
    label: "Best fit",
    color: "var(--green)",
  },
  recommendation: {
    label: "Good fit",
    color: "#8aaa7a",
  },
  normal: {
    label: "Will run",
    color: "var(--amber)",
  },
  not_recommended: {
    label: "Won't run",
    color: "var(--text-dim)",
  },
};

export function FitBadge({ fit }: { fit: FitTier }) {
  const config = FIT_CONFIG[fit];
  return (
    <span
      className="font-data inline-block text-[0.625rem] font-medium uppercase tracking-[0.08em]"
      style={{ color: config.color }}
    >
      {config.label}
    </span>
  );
}

export function fitCardClass(fit: FitTier): string {
  return `model-card-fit-${fit}`;
}
