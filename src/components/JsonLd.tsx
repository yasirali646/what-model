import { createJsonLdGraph } from "@/lib/seo/metadata";

export function JsonLd() {
  const data = createJsonLdGraph();

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
