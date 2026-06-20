import { NextResponse } from "next/server";
import { detectOllama } from "@/lib/ollama/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ollama = await detectOllama();
    return NextResponse.json(ollama);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to detect Ollama";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
