import type { Metadata } from "next";
import { faqItems, siteConfig, siteUrl } from "./site";

export function createSiteMetadata(): Metadata {
  const ogImage = {
    url: "/opengraph-image",
    width: 1200,
    height: 630,
    alt: `${siteConfig.name} — ${siteConfig.tagline}`,
  };

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: siteConfig.title,
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    applicationName: siteConfig.name,
    authors: [...siteConfig.authors],
    creator: siteConfig.creator,
    publisher: siteConfig.publisher,
    category: siteConfig.category,
    keywords: [...siteConfig.keywords],
    referrer: "origin-when-cross-origin",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url: siteUrl,
      siteName: siteConfig.name,
      title: siteConfig.title,
      description: siteConfig.description,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: siteConfig.title,
      description: siteConfig.shortDescription,
      images: [ogImage.url],
      ...(siteConfig.twitterHandle
        ? { creator: `@${siteConfig.twitterHandle.replace(/^@/, "")}` }
        : {}),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: [{ url: "/favicon.ico" }, { url: "/icon.png", type: "image/png" }],
      apple: [{ url: "/apple-icon.png", type: "image/png" }],
    },
    manifest: "/manifest.webmanifest",
    other: {
      "apple-mobile-web-app-title": siteConfig.name,
    },
  };
}

export function createJsonLdGraph() {
  const appSchema = {
    "@type": "WebApplication",
    "@id": `${siteUrl}/#webapp`,
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteUrl,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Windows, macOS, Linux",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Hardware detection",
      "VRAM and RAM fit estimation",
      "Quantization recommendations",
      "Ollama integration",
      "Model comparison",
    ],
  };

  const orgSchema = {
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: siteConfig.name,
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    ...(siteConfig.githubUrl ? { sameAs: [siteConfig.githubUrl] } : {}),
  };

  const websiteSchema = {
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteUrl,
    publisher: { "@id": `${siteUrl}/#organization` },
    inLanguage: "en-US",
  };

  const faqSchema = {
    "@type": "FAQPage",
    "@id": `${siteUrl}/#faq`,
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return {
    "@context": "https://schema.org",
    "@graph": [websiteSchema, orgSchema, appSchema, faqSchema],
  };
}
