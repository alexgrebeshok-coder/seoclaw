import { NextRequest, NextResponse } from "next/server";

import { authorizeRequest } from "@/app/api/middleware/auth";
import { getEscalationQueueOverview } from "@/lib/escalations";
import { liveOperatorDataUnavailable, serverError } from "@/lib/server/api-utils";
import {
  getLiveOperatorDataBlockReason,
  getServerRuntimeState,
} from "@/lib/server/runtime-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authResult = await authorizeRequest(request, {
    permission: "VIEW_WORK_REPORTS",
  });
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const runtimeState = getServerRuntimeState();
  if (getLiveOperatorDataBlockReason(runtimeState)) {
    return liveOperatorDataUnavailable(runtimeState);
  }

  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;
  const includeResolved = request.nextUrl.searchParams.get("includeResolved") === "true";
  const projectId = request.nextUrl.searchParams.get("projectId") || undefined;

  try {
    const queue = await getEscalationQueueOverview({
      includeResolved,
      limit,
      projectId,
    });

    return NextResponse.json(queue);
  } catch (error) {
    return serverError(error, "Failed to load escalation queue.", "ESCALATION_QUEUE_FAILED");
  }
}
