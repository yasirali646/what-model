import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/seo/site";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0e0d0b",
          padding: "64px 72px",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              border: "2px solid #d4954a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#e8b060",
              fontSize: 40,
              fontWeight: 400,
            }}
          >
            ?
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                color: "#ede8df",
                fontSize: 52,
                letterSpacing: "-0.02em",
              }}
            >
              {siteConfig.name}
            </div>
            <div
              style={{
                color: "#8c8478",
                fontSize: 22,
                fontFamily: "monospace",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginTop: 8,
              }}
            >
              {siteConfig.tagline}
            </div>
          </div>
        </div>

        <div
          style={{
            color: "#8c8478",
            fontSize: 28,
            lineHeight: 1.45,
            maxWidth: 900,
            fontFamily: "monospace",
          }}
        >
          {siteConfig.shortDescription}
        </div>
      </div>
    ),
    { ...size },
  );
}
