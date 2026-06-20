import type { ModelRecommendation } from "@/types";
import { ModelCard } from "./ModelCard";

interface TopPicksProps {
  picks: ModelRecommendation[];
  pulledModels: string[];
  compareLeftId: string | null;
  compareRightId: string | null;
  onCompareToggle: (modelId: string) => void;
}

export function TopPicks({
  picks,
  pulledModels,
  compareLeftId,
  compareRightId,
  onCompareToggle,
}: TopPicksProps) {
  if (picks.length === 0) return null;

  return (
    <div className="top-picks mb-8">
      <p className="top-picks-label">Top picks</p>
      <p className="top-picks-sub">
        Best fit on your hardware
        {picks.length > 1 ? ` · ${picks.length} models` : ""}
      </p>
      <div
        className={`top-picks-grid top-picks-grid-${Math.min(picks.length, 3)}`}
      >
        {picks.map((rec, i) => (
          <div
            key={rec.model.id}
            className="animate-in"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <ModelCard
              rec={rec}
              topPickRank={i + 1}
              pulledModels={pulledModels}
              compareSelected={
                compareLeftId === rec.model.id ||
                compareRightId === rec.model.id
              }
              onCompareToggle={() => onCompareToggle(rec.model.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
