import type { ModelFamily } from "@/types";
import { getFamilyStyle } from "@/lib/models/family-style";
import { FamilyIcon } from "./FamilyIcon";

interface FamilyMarkProps {
  family: ModelFamily | "all";
  size?: "sm" | "md";
}

const MARK_SIZE = { sm: 16, md: 20 } as const;
const ICON_SIZE = { sm: 9, md: 11 } as const;

export function FamilyMark({ family, size = "sm" }: FamilyMarkProps) {
  const markPx = MARK_SIZE[size];
  const iconPx = ICON_SIZE[size];

  if (family === "all") {
    return (
      <span
        className="family-mark family-mark-all"
        style={{ width: markPx, height: markPx }}
        aria-hidden
      >
        <svg
          width={iconPx}
          height={iconPx}
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden
        >
          <circle cx="3.5" cy="3.5" r="1.1" fill="var(--text-dim)" />
          <circle cx="8.5" cy="3.5" r="1.1" fill="var(--text-dim)" />
          <circle cx="3.5" cy="8.5" r="1.1" fill="var(--text-dim)" />
          <circle cx="8.5" cy="8.5" r="1.1" fill="var(--text-dim)" />
        </svg>
      </span>
    );
  }

  const style = getFamilyStyle(family);

  return (
    <span
      className="family-mark"
      style={{
        width: markPx,
        height: markPx,
        backgroundColor: style.color,
      }}
      aria-hidden
    >
      <FamilyIcon family={family} size={iconPx} variant="onColor" />
    </span>
  );
}
