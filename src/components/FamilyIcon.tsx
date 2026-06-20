import type { ModelFamily } from "@/types";

interface FamilyIconProps {
  family: ModelFamily;
  size?: number;
  className?: string;
  variant?: "default" | "onColor" | "neutral";
}

export function FamilyIcon({
  family,
  size = 12,
  className,
  variant = "default",
}: FamilyIconProps) {
  const stroke =
    variant === "onColor"
      ? "var(--bg)"
      : variant === "neutral"
        ? "var(--text-dim)"
        : "currentColor";

  const common = {
    width: size,
    height: size,
    viewBox: "0 0 12 12",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    className,
    "aria-hidden": true as const,
  };

  const sw = "1.5";

  switch (family) {
    case "llama":
      return (
        <svg {...common}>
          <path
            d="M2 8.5c.8-2 2-3.2 4-3.2s3.2 1.2 4 3.2"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
          />
          <circle cx="4.25" cy="4" r="0.85" fill={stroke} />
          <circle cx="7.75" cy="4" r="0.85" fill={stroke} />
        </svg>
      );
    case "mistral":
      return (
        <svg {...common}>
          <path
            d="M1.5 3.75h9M2.25 6h7.5M3 8.25h6"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
          />
        </svg>
      );
    case "qwen":
      return (
        <svg {...common}>
          <circle cx="5.75" cy="5.5" r="3" stroke={stroke} strokeWidth={sw} />
          <path
            d="M8.25 8.25 10.25 10.25"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
          />
        </svg>
      );
    case "deepseek":
      return (
        <svg {...common}>
          <path
            d="M6 2v3.25M6 5.25 3.75 7.5M6 5.25 8.25 7.5M6 7.5V10"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "phi":
      return (
        <svg {...common}>
          <circle cx="6" cy="4.25" r="2.5" stroke={stroke} strokeWidth={sw} />
          <path
            d="M6 6.75V10"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
          />
        </svg>
      );
    case "gemma":
      return (
        <svg {...common}>
          <path
            d="M6 2 9.5 6 6 10 2.5 6Z"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
        </svg>
      );
    case "nomic":
      return (
        <svg {...common}>
          <circle cx="3" cy="6" r="1.1" fill={stroke} />
          <circle cx="9" cy="3.25" r="1.1" fill={stroke} />
          <circle cx="9" cy="8.75" r="1.1" fill={stroke} />
          <path
            d="M3.9 5.5 8.1 3.75M3.9 6.5 8.1 8.25"
            stroke={stroke}
            strokeWidth="1.15"
          />
        </svg>
      );
    case "bge":
      return (
        <svg {...common}>
          <rect x="2" y="2.25" width="8" height="1.75" rx="0.4" fill={stroke} />
          <rect
            x="2"
            y="5.125"
            width="8"
            height="1.75"
            rx="0.4"
            fill={stroke}
            opacity="0.72"
          />
          <rect
            x="2"
            y="8"
            width="8"
            height="1.75"
            rx="0.4"
            fill={stroke}
            opacity="0.44"
          />
        </svg>
      );
    case "mxbai":
      return (
        <svg {...common}>
          <rect
            x="2"
            y="2"
            width="3.25"
            height="3.25"
            rx="0.4"
            stroke={stroke}
            strokeWidth="1.15"
          />
          <rect
            x="6.75"
            y="2"
            width="3.25"
            height="3.25"
            rx="0.4"
            stroke={stroke}
            strokeWidth="1.15"
          />
          <rect
            x="2"
            y="6.75"
            width="3.25"
            height="3.25"
            rx="0.4"
            stroke={stroke}
            strokeWidth="1.15"
          />
          <rect
            x="6.75"
            y="6.75"
            width="3.25"
            height="3.25"
            rx="0.4"
            stroke={stroke}
            strokeWidth="1.15"
          />
        </svg>
      );
    case "snowflake":
      return (
        <svg {...common}>
          <path
            d="M6 1.5v9M1.5 6h9M3.1 3.1l5.8 5.8M8.9 3.1l-5.8 5.8"
            stroke={stroke}
            strokeWidth="1.15"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}
