import { NextResponse } from "next/server";
import { detectSystem } from "@/lib/hardware/detector";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const profile = await detectSystem();
    return NextResponse.json(profile);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to detect system";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
