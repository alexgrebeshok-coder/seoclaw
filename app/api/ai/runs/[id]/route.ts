import { NextResponse } from "next/server";

import { getServerAIRun } from "@/lib/ai/server-runs";
import { notFound } from "@/lib/server/api-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const run = await getServerAIRun(id);
    return NextResponse.json(run);
  } catch (error) {
    return notFound(
      error instanceof Error ? error.message : "Failed to load AI run.",
      "AI_RUN_NOT_FOUND"
    );
  }
}
