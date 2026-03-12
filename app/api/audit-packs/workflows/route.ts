import { NextRequest, NextResponse } from "next/server";

import { authorizeRequest } from "@/app/api/middleware/auth";
import { listWorkflowAuditPackCandidates } from "@/lib/audit-packs";
import {
  liveOperatorDataUnavailable,
  parseOptionalInteger,
  serverError,
} from "@/lib/server/api-utils";
import {
  getLiveOperatorDataBlockReason,
  getServerRuntimeState,
} from "@/lib/server/runtime-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authResult = authorizeRequest(request, {
    permission: "VIEW_WORK_REPORTS",
    workspaceId: "delivery",
  });
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const runtimeState = getServerRuntimeState();
  if (getLiveOperatorDataBlockReason(runtimeState)) {
    return liveOperatorDataUnavailable(runtimeState);
  }

  try {
    const limit = parseOptionalInteger(request.nextUrl.searchParams.get("limit")) ?? 12;
    const items = await listWorkflowAuditPackCandidates({ limit });
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      items,
    });
  } catch (error) {
    return serverError(error, "Failed to list audit-pack candidates.", "AUDIT_PACK_LIST_FAILED");
  }
}

