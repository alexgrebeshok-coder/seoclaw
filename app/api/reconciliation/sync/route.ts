import { NextRequest, NextResponse } from "next/server";

import { authorizeRequest } from "@/app/api/middleware/auth";
import { getReconciliationCasefiles, syncReconciliationCasefiles } from "@/lib/enterprise-truth";
import { serverError } from "@/lib/server/api-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const authResult = await authorizeRequest(request, {
    permission: "VIEW_CONNECTORS",
    workspaceId: "executive",
  });
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "24");

  try {
    await syncReconciliationCasefiles();
    const overview = await getReconciliationCasefiles({
      ...(Number.isFinite(limit) ? { limit } : {}),
    });
    return NextResponse.json(overview);
  } catch (error) {
    return serverError(
      error,
      "Failed to sync reconciliation casefiles.",
      "RECONCILIATION_SYNC_FAILED"
    );
  }
}
