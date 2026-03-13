import { NextRequest, NextResponse } from "next/server";

import { authorizeRequest } from "@/app/api/middleware/auth";
import {
  getReconciliationCasefiles,
  type ReconciliationCaseResolutionStatus,
  type ReconciliationCaseTruthStatus,
  type ReconciliationCaseType,
} from "@/lib/enterprise-truth";
import { parseOptionalInteger } from "@/lib/server/api-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authResult = authorizeRequest(request, {
    permission: "VIEW_CONNECTORS",
    workspaceId: "executive",
  });
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { searchParams } = request.nextUrl;
  const limit = parseOptionalInteger(searchParams.get("limit")) ?? 12;
  const projectId = searchParams.get("projectId") ?? undefined;
  const caseType = searchParams.get("caseType") as ReconciliationCaseType | null;
  const truthStatus = searchParams.get("truthStatus") as ReconciliationCaseTruthStatus | null;
  const resolutionStatus = searchParams.get(
    "resolutionStatus"
  ) as ReconciliationCaseResolutionStatus | null;

  const overview = await getReconciliationCasefiles({
    limit,
    ...(projectId ? { projectId } : {}),
    ...(caseType ? { caseType } : {}),
    ...(truthStatus ? { truthStatus } : {}),
    ...(resolutionStatus ? { resolutionStatus } : {}),
  });

  return NextResponse.json(overview);
}
