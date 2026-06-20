"use client";

import { useState, type ReactNode } from "react";
import type { ModelRecommendation, FitTier } from "@/types";
import { FitBadge } from "./FitBadge";
import { FamilyBadge } from "./FamilyBadge";

interface ModelCompareProps {
  recommendations: ModelRecommendation[];
  leftId: string | null;
  rightId: string | null;
  onLeftChange: (id: string) => void;
  onRightChange: (id: string) => void;
  onClear: () => void;
}

const FIT_ORDER: Record<FitTier, number> = {
  strong_recommendation: 0,
  recommendation: 1,
  normal: 2,
  not_recommended: 3,
};

function pickBetterFit(
  a: ModelRecommendation,
  b: ModelRecommendation,
): ModelRecommendation {
  const orderDiff = FIT_ORDER[a.fit] - FIT_ORDER[b.fit];
  if (orderDiff !== 0) return orderDiff < 0 ? a : b;
  return a.headroomPercent >= b.headroomPercent ? a : b;
}

function CompareGrid({
  left,
  right,
  leftWins,
  rightWins,
  rows,
}: {
  left: ModelRecommendation;
  right: ModelRecommendation;
  leftWins: boolean;
  rightWins: boolean;
  rows: { label: string; left: ReactNode; right: ReactNode }[];
}) {
  return (
    <div className="compare-grid">
      <div className="compare-grid-corner" />
      <div
        className={`compare-grid-head ${leftWins ? "compare-grid-head-winner" : ""}`}
      >
        {left.model.name}
      </div>
      <div
        className={`compare-grid-head ${rightWins ? "compare-grid-head-winner" : ""}`}
      >
        {right.model.name}
      </div>

      {rows.map((row) => (
        <div key={row.label} className="compare-grid-row">
          <div className="compare-grid-label">{row.label}</div>
          <div
            className={`compare-grid-cell ${leftWins ? "compare-grid-cell-winner" : ""}`}
          >
            {row.left}
          </div>
          <div
            className={`compare-grid-cell ${rightWins ? "compare-grid-cell-winner" : ""}`}
          >
            {row.right}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ModelCompare({
  recommendations,
  leftId,
  rightId,
  onLeftChange,
  onRightChange,
  onClear,
}: ModelCompareProps) {
  const [showQuants, setShowQuants] = useState(false);
  const [copiedSide, setCopiedSide] = useState<"left" | "right" | null>(null);

  const left = recommendations.find((r) => r.model.id === leftId);
  const right = recommendations.find((r) => r.model.id === rightId);
  const ready = left && right;
  const better = left && right ? pickBetterFit(left, right) : null;
  const leftWins = better?.model.id === left?.model.id;
  const rightWins = better?.model.id === right?.model.id;

  async function copyCommand(side: "left" | "right", cmd?: string) {
    if (!cmd) return;
    await navigator.clipboard.writeText(cmd);
    setCopiedSide(side);
    setTimeout(() => setCopiedSide(null), 2000);
  }

  const mainRows =
    left && right
      ? [
          {
            label: "Fit",
            left: <FitBadge fit={left.fit} />,
            right: <FitBadge fit={right.fit} />,
          },
          {
            label: "Size",
            left: `${left.model.paramsB}B`,
            right: `${right.model.paramsB}B`,
          },
          {
            label: "Best quant",
            left: left.bestQuantization.replace("_", " "),
            right: right.bestQuantization.replace("_", " "),
          },
          {
            label: "Memory",
            left: (
              <>
                {left.estimatedMemoryGB} GB · {left.memorySource}
              </>
            ),
            right: (
              <>
                {right.estimatedMemoryGB} GB · {right.memorySource}
              </>
            ),
          },
          {
            label: "Headroom",
            left:
              left.fit === "not_recommended" ? "—" : `${left.headroomPercent}%`,
            right:
              right.fit === "not_recommended"
                ? "—"
                : `${right.headroomPercent}%`,
          },
          {
            label: "Family",
            left: <FamilyBadge family={left.model.family} size="md" />,
            right: <FamilyBadge family={right.model.family} size="md" />,
          },
          {
            label: "Use cases",
            left: (
              <div className="compare-tags">
                {left.model.useCases.map((uc) => (
                  <span key={uc} className="tag">
                    {uc}
                  </span>
                ))}
              </div>
            ),
            right: (
              <div className="compare-tags">
                {right.model.useCases.map((uc) => (
                  <span key={uc} className="tag">
                    {uc}
                  </span>
                ))}
              </div>
            ),
          },
        ]
      : [];

  return (
    <section id="compare" className="compare-section scroll-mt-8">
      <div className="compare-section-header">
        <div>
          <h2 className="section-title mb-0">
            <span>03</span> / Compare
          </h2>
          <p className="section-sub mt-1">
            Pick two models to see how they compare
          </p>
        </div>
        {(leftId || rightId) && (
          <button type="button" onClick={onClear} className="btn-ghost">
            Clear
          </button>
        )}
      </div>

      <div className="compare-pickers">
        <div className="compare-picker">
          <label htmlFor="compare-a" className="compare-picker-label">
            Model A
          </label>
          <select
            id="compare-a"
            className="compare-select"
            value={leftId ?? ""}
            onChange={(e) => onLeftChange(e.target.value)}
          >
            <option value="">Select a model…</option>
            {recommendations.map((r) => (
              <option key={r.model.id} value={r.model.id}>
                {r.model.name}
              </option>
            ))}
          </select>
        </div>

        <div className="compare-picker-vs">vs</div>

        <div className="compare-picker">
          <label htmlFor="compare-b" className="compare-picker-label">
            Model B
          </label>
          <select
            id="compare-b"
            className="compare-select"
            value={rightId ?? ""}
            onChange={(e) => onRightChange(e.target.value)}
          >
            <option value="">Select a model…</option>
            {recommendations.map((r) => (
              <option key={r.model.id} value={r.model.id}>
                {r.model.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {ready && better && left && right && (
        <div className="compare-results">
          <p className="compare-verdict">
            <strong>{better.model.name}</strong> fits your hardware better
          </p>

          <CompareGrid
            left={left}
            right={right}
            leftWins={leftWins}
            rightWins={rightWins}
            rows={mainRows}
          />

          <button
            type="button"
            className="compare-toggle-quants"
            onClick={() => setShowQuants(!showQuants)}
          >
            {showQuants ? "Hide" : "Show"} memory by quantization
          </button>

          {showQuants && (
            <CompareGrid
              left={left}
              right={right}
              leftWins={leftWins}
              rightWins={rightWins}
              rows={left.quantizationBreakdown.map((lq, i) => {
                const rq = right.quantizationBreakdown[i];
                return {
                  label: lq.quantization.replace("_", " "),
                  left: (
                    <span
                      className={
                        lq.fits ? "compare-fits-yes" : "compare-fits-no"
                      }
                    >
                      {lq.totalGB} GB · {lq.fits ? "Fits" : "No"}
                    </span>
                  ),
                  right: (
                    <span
                      className={
                        rq.fits ? "compare-fits-yes" : "compare-fits-no"
                      }
                    >
                      {rq.totalGB} GB · {rq.fits ? "Fits" : "No"}
                    </span>
                  ),
                };
              })}
            />
          )}

          <div className="compare-actions">
            {[left, right].map((rec, i) => {
              const side = i === 0 ? "left" : "right";
              const wins = side === "left" ? leftWins : rightWins;
              const cmd = rec.ollamaPulled
                ? rec.ollamaRunCommand
                : rec.ollamaCommand;
              return (
                cmd && (
                  <button
                    key={rec.model.id}
                    type="button"
                    className={`btn-copy ${wins ? "compare-action-winner" : ""}`}
                    disabled={rec.fit === "not_recommended" && !rec.ollamaPulled}
                    onClick={() => copyCommand(side, cmd)}
                  >
                    {copiedSide === side
                      ? "Copied!"
                      : rec.ollamaPulled
                        ? `Run: ${cmd}`
                        : cmd}
                  </button>
                )
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
