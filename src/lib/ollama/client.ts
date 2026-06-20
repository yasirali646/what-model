import { execFile } from "child_process";
import { promisify } from "util";
import type { OllamaStatus } from "@/types";
import { isOllamaModelPulled, normalizeOllamaTag } from "@/lib/ollama/tags";

const execFileAsync = promisify(execFile);

const OLLAMA_API = "http://127.0.0.1:11434";

export { isOllamaModelPulled, normalizeOllamaTag };

async function checkOllamaInstalled(): Promise<boolean> {
  try {
    await execFileAsync("ollama", ["--version"], { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

async function fetchOllamaModels(): Promise<string[]> {
  const res = await fetch(`${OLLAMA_API}/api/tags`, {
    signal: AbortSignal.timeout(3000),
    cache: "no-store",
  });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    models?: { name: string }[];
  };

  return (data.models ?? []).map((m) => normalizeOllamaTag(m.name));
}

export async function detectOllama(): Promise<OllamaStatus> {
  const installed = await checkOllamaInstalled();
  if (!installed) {
    return { installed: false, running: false, models: [] };
  }

  try {
    const models = await fetchOllamaModels();
    return { installed: true, running: true, models };
  } catch {
    return { installed: true, running: false, models: [] };
  }
}
