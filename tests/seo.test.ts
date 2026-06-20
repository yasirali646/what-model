import { describe, it, expect } from "vitest";
import { createSiteMetadata, createJsonLdGraph } from "@/lib/seo/metadata";
import { faqItems, siteConfig } from "@/lib/seo/site";

describe("siteConfig", () => {
  it("includes core SEO fields", () => {
    expect(siteConfig.name).toBe("What Model");
    expect(siteConfig.description.length).toBeGreaterThan(50);
    expect(siteConfig.keywords.length).toBeGreaterThan(5);
  });
});

describe("createSiteMetadata", () => {
  it("sets open graph and twitter metadata", () => {
    const metadata = createSiteMetadata();
    expect(metadata.title).toBeDefined();
    expect(metadata.description).toBe(siteConfig.description);
    expect(metadata.openGraph?.title).toBe(siteConfig.title);
    expect(metadata.twitter?.card).toBe("summary_large_image");
    expect(metadata.alternates?.canonical).toBe("/");
  });
});

describe("createJsonLdGraph", () => {
  it("includes FAQ structured data", () => {
    const graph = createJsonLdGraph();
    expect(graph["@graph"]).toHaveLength(4);
    const faq = graph["@graph"].find(
      (node) => node["@type"] === "FAQPage",
    ) as { mainEntity: unknown[] };
    expect(faq.mainEntity).toHaveLength(faqItems.length);
  });
});
