import type { ModelFamily } from "@/types";
import { MODEL_FAMILY_LABELS } from "@/lib/models/catalog";
import { getFamilyStyle } from "@/lib/models/family-style";
import { FamilyMark } from "./FamilyMark";

interface FamilyBadgeProps {
  family: ModelFamily;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export function FamilyBadge({
  family,
  showLabel = true,
  size = "sm",
}: FamilyBadgeProps) {
  const style = getFamilyStyle(family);

  return (
    <span className={`family-badge family-badge-${size}`}>
      <FamilyMark family={family} size={size} />
      {showLabel && (
        <span
          className="family-badge-label"
          style={{ color: style.color }}
        >
          {MODEL_FAMILY_LABELS[family]}
        </span>
      )}
    </span>
  );
}

interface FamilyNavItemProps {
  family: ModelFamily | "all";
  label: string;
  active?: boolean;
}

export function FamilyNavContent({
  family,
  label,
  active = false,
}: FamilyNavItemProps) {
  const familyStyle = family !== "all" ? getFamilyStyle(family) : null;

  return (
    <span className="family-nav-content">
      <FamilyMark family={family} size="sm" />
      <span
        className="family-nav-label"
        style={
          active && familyStyle ? { color: familyStyle.color } : undefined
        }
      >
        {label}
      </span>
    </span>
  );
}
