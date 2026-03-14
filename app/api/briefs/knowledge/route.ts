import { NextRequest, NextResponse } from "next/server";

import { authorizeRequest } from "@/app/api/middleware/auth";
import { getKnowledgeLoopOverview } from "@/lib/knowledge";
import {
  liveOperatorDataUnavailable,
  parseOptionalInteger,
  serverError,
} from "@/lib/server/api-utils";
import {
  canReadLiveOperatorData,
  getServerRuntimeState,
} from "@/lib/server/runtime-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await authorizeRequest(request, {
      permission: "VIEW_EXECUTIVE_BRIEFS",
      workspaceId: "executive",
    });
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const runtimeState = getServerRuntimeState();
    if (!canReadLiveOperatorData(runtimeState)) {
      return liveOperatorDataUnavailable(runtimeState);
    }

    const { searchParams } = new URL(request.url);
    const limit = parseOptionalInteger(searchParams.get("limit")) ?? 4;
    const projectId = searchParams.get("projectId")?.trim() || undefined;

    const overview = await getKnowledgeLoopOverview({ limit, projectId });
    return NextResponse.json(overview);
  } catch (error) {
    return serverError(error, "Failed to build knowledge loop overview.");
  }
}
