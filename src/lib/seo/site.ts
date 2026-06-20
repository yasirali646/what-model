function normalizeSiteUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, "");
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export const siteConfig = {
  name: "What Model",
  tagline: "Local LLM Fit Checker",
  title: "What Model | Local LLM Fit Checker",
  description:
    "Scan your CPU, GPU, and RAM to see which local AI models fit your hardware. Get quantization advice, VRAM estimates, and ready-to-run Ollama commands for Llama, Qwen, Mistral, and more.",
  shortDescription:
    "Find which local LLM models your PC can run with accurate VRAM and RAM fit checks.",
  url: normalizeSiteUrl(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  locale: "en_US",
  category: "Developer Tools",
  keywords: [
    "local LLM",
    "Ollama",
    "VRAM calculator",
    "LLM fit checker",
    "quantization",
    "Q4 Q5 Q8",
    "Llama 3",
    "Qwen",
    "Mistral",
    "GPU memory",
    "local AI models",
    "llama.cpp",
    "hardware profiler",
    "model recommendations",
  ],
  authors: [{ name: "What Model" }],
  creator: "What Model",
  publisher: "What Model",
  twitterHandle: process.env.NEXT_PUBLIC_TWITTER_HANDLE,
  githubUrl: process.env.NEXT_PUBLIC_GITHUB_URL,
} as const;

export const siteUrl = siteConfig.url;

export const faqItems = [
  {
    question: "What does What Model do?",
    answer:
      "What Model scans your system hardware (CPU, RAM, GPU, and VRAM) and recommends open-weight LLMs that fit your machine, including the best quantization level and copy-ready Ollama pull and run commands.",
  },
  {
    question: "Do I need Ollama installed?",
    answer:
      "No. Recommendations work without Ollama. If Ollama is installed and running locally, the app detects pulled models and marks them on each card.",
  },
  {
    question: "How accurate are the memory estimates?",
    answer:
      "Estimates are based on parameter count, quantization format, and context length. They are approximate; actual usage varies by runtime such as Ollama, llama.cpp, or LM Studio.",
  },
  {
    question: "Should I run this on the machine I use for inference?",
    answer:
      "Yes. For accurate results, run What Model on the same PC or laptop where you plan to run local models. On phones and tablets, use manual VRAM and RAM configuration.",
  },
] as const;
