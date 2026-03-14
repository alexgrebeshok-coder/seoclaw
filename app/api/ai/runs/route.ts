import { NextRequest, NextResponse } from "next/server";

import { authorizeRequest } from "@/app/api/middleware/auth";

import { createServerAIRun } from "@/lib/ai/server-runs";
import type { AIRunInput } from "@/lib/ai/types";
import { serverError } from "@/lib/server/api-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Require authentication
  const authResult = await authorizeRequest(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }


  try {
    const input = (await request.json()) as AIRunInput;
    const run = await createServerAIRun(input);
    return NextResponse.json(run);
  } catch (error) {
    return serverError(error, "Failed to create AI run.", "AI_RUN_CREATE_FAILED");
  }
}
