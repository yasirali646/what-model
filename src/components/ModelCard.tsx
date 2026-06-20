"use client";

import { useEffect, useState } from "react";
import type { ModelRecommendation, OllamaStatus, Quantization } from "@/types";
import { getShortQuantLabel } from "@/lib/engine/vram";
import {
  buildOllamaPullCommand,
  buildOllamaRunCommand,
  formatOllamaTagForQuant,
  isOllamaModelPulled,
} from "@/lib/ollama/tags";
import { FitBadge, fitCardClass } from "./FitBadge";
import { FamilyBadge } from "./FamilyBadge";

interface ModelCardProps {
  rec: ModelRecommendation;
  pulledModels?: string[];
  topPickRank?: number;
  compareSelected?: boolean;
  onCompareToggle?: () => void;
}

export function ModelCard({
  rec,
  pulledModels = [],
  topPickRank,
  compareSelected = false,
  onCompareToggle,
}: ModelCardProps) {
  const [copied, setCopied] = useState(false);
  const [selectedQuant, setSelectedQuant] = useState<Quantization>(
    rec.bestQuantization,
  );

  const { model } = rec;
  const dim = rec.fit === "not_recommended";

  useEffect(() => {
    setSelectedQuant(rec.bestQuantization);
  }, [rec.model.id, rec.bestQuantization]);

  const selectedEntry = rec.quantizationBreakdown.find(
    (e) => e.quantization === selectedQuant,
  );

  const baseTag = model.ollamaTag;
  const selectedTag = baseTag
    ? formatOllamaTagForQuant(model, selectedQuant)
    : undefined;
  const selectedPulled =
    selectedTag !== undefined &&
    isOllamaModelPulled(selectedTag, pulledModels, model);

  const pullCommand =
    baseTag && selectedEntry?.fits
      ? buildOllamaPullCommand(model, selectedQuant)
      : undefined;
  const runCommand =
    baseTag && selectedEntry?.fits
      ? buildOllamaRunCommand(model, selectedQuant)
      : undefined;
  const actionCommand = selectedPulled ? runCommand : pullCommand;

  async function copyCommand() {
    if (!actionCommand) return;
    await navigator.clipboard.writeText(actionCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function selectQuant(quant: Quantization, fits: boolean) {
    if (!fits) return;
    setSelectedQuant(quant);
  }

  return (
    <article
      className={`model-card ${fitCardClass(rec.fit)} ${dim ? "model-card-dim" : ""} ${topPickRank ? "model-card-top-pick" : ""}`}
    >
      <div className="panel-header">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg leading-tight text-[var(--text)]">
              {model.name}
            </h3>
            {topPickRank !== undefined && (
              <span className="badge badge-top-pick">
                Top pick{topPickRank > 1 ? ` #${topPickRank}` : ""}
              </span>
            )}
            {selectedPulled && (
              <span className="badge badge-accent">In Ollama</span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="font-data text-[0.625rem] text-[var(--text-dim)]">
              {model.paramsB}B
              {model.activeParamsB && ` · ${model.activeParamsB}B active`}
            </p>
            <FamilyBadge family={model.family} />
          </div>
        </div>
        <FitBadge fit={rec.fit} />
      </div>

      <div className="panel-body space-y-4">
        {model.description && (
          <p className="text-[0.8125rem] leading-relaxed text-[var(--text-muted)]">
            {model.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="stat-block">
            <p className="stat-block-label">Quant</p>
            <p className="stat-block-value text-[var(--accent-bright)]">
              {getShortQuantLabel(selectedQuant)}
            </p>
          </div>
          <div className="stat-block">
            <p className="stat-block-label">Memory</p>
            <p className="stat-block-value">
              {selectedEntry?.totalGB ?? rec.estimatedMemoryGB} GB
              <span className="ml-1 text-[0.625rem] text-[var(--text-dim)]">
                {rec.memorySource}
              </span>
            </p>
          </div>
        </div>

        <div>
          <p className="stat-block-label mb-2">Quant fit</p>
          <table className="quant-table">
            <thead>
              <tr>
                <th scope="col">Quant</th>
                <th scope="col">Fit</th>
                <th scope="col" className="quant-table-col-mem">
                  Mem
                </th>
              </tr>
            </thead>
            <tbody>
              {rec.quantizationBreakdown.map((entry) => {
                const isSelected = entry.quantization === selectedQuant;
                const rowClass = [
                  entry.fits ? "quant-table-row-selectable" : "",
                  isSelected ? "quant-table-row-selected" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <tr
                    key={entry.quantization}
                    className={rowClass || undefined}
                    onClick={() =>
                      selectQuant(entry.quantization, entry.fits)
                    }
                    onKeyDown={(e) => {
                      if (
                        entry.fits &&
                        (e.key === "Enter" || e.key === " ")
                      ) {
                        e.preventDefault();
                        selectQuant(entry.quantization, entry.fits);
                      }
                    }}
                    tabIndex={entry.fits ? 0 : undefined}
                    role={entry.fits ? "button" : undefined}
                    aria-pressed={entry.fits ? isSelected : undefined}
                    aria-disabled={!entry.fits}
                  >
                    <td className="quant-table-quant">
                      {getShortQuantLabel(entry.quantization)}
                    </td>
                    <td
                      className={
                        entry.fits
                          ? "quant-table-fits-yes"
                          : "quant-table-fits-no"
                      }
                    >
                      {entry.fits ? "Yes" : "—"}
                    </td>
                    <td className="quant-table-col-mem">{entry.totalGB}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {rec.headroomPercent > 0 &&
          rec.fit !== "not_recommended" &&
          selectedQuant === rec.bestQuantization && (
            <div className="flex items-center gap-3">
              <div className="headroom-bar">
                <div
                  className="headroom-fill"
                  style={{ width: `${Math.min(rec.headroomPercent, 100)}%` }}
                />
              </div>
              <span className="font-data shrink-0 text-[0.625rem] text-[var(--text-dim)]">
                {rec.headroomPercent}%
              </span>
            </div>
          )}

        <div className="flex flex-wrap gap-1.5">
          {model.useCases.map((uc) => (
            <span key={uc} className="tag">
              {uc}
            </span>
          ))}
        </div>

        {rec.notes.length > 0 && (
          <ul className="space-y-1 border-t border-[var(--border)] pt-3">
            {rec.notes.map((note, i) => (
              <li
                key={i}
                className="font-data text-[0.625rem] leading-relaxed text-[var(--text-dim)]"
              >
                {note}
              </li>
            ))}
          </ul>
        )}

        {actionCommand && (
          <button
            onClick={copyCommand}
            className="btn-copy"
            disabled={!selectedEntry?.fits && !selectedPulled}
          >
            {copied
              ? "Copied to clipboard"
              : selectedPulled
                ? `Run: ${actionCommand}`
                : actionCommand}
          </button>
        )}

        {onCompareToggle && (
          <button
            type="button"
            onClick={onCompareToggle}
            className={`btn-compare ${compareSelected ? "btn-compare-active" : ""}`}
          >
            {compareSelected ? "In compare" : "+ Compare"}
          </button>
        )}
      </div>
    </article>
  );
}

export function ollamaStatusLabel(status: OllamaStatus | null): string {
  if (!status) return "Checking…";
  if (!status.installed) return "Not installed";
  if (!status.running) return "Installed, not running";
  const count = status.models.length;
  return count > 0 ? `Running · ${count} pulled` : "Running · no models";
}
