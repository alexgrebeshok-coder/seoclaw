import { NextRequest, NextResponse } from "next/server";

import { authorizeRequest } from "@/app/api/middleware/auth";
import { getEvidenceLedgerOverview, syncEvidenceLedger } from "@/lib/evidence";
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

  const { searchParams } = request.nextUrl;
  const limit = Number(searchParams.get("limit") ?? "8");
  const verificationStatus = searchParams.get("verificationStatus") ?? undefined;
  const entityType = searchParams.get("entityType") ?? undefined;
  const entityRef = searchParams.get("entityRef") ?? undefined;
  const projectId = searchParams.get("projectId") ?? undefined;

  try {
    await syncEvidenceLedger();

    const overview = await getEvidenceLedgerOverview({
      ...(Number.isFinite(limit) ? { limit } : {}),
      ...(verificationStatus ? { verificationStatus: verificationStatus as "reported" | "observed" | "verified" } : {}),
      ...(entityType ? { entityType } : {}),
      ...(entityRef ? { entityRef } : {}),
      ...(projectId ? { projectId } : {}),
    });

    return NextResponse.json(overview);
  } catch (error) {
    return serverError(error, "Failed to sync evidence ledger.", "EVIDENCE_SYNC_FAILED");
  }
}
