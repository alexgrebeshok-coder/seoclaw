import { NextRequest, NextResponse } from "next/server";

import { authorizeRequest } from "@/app/api/middleware/auth";
import { serverError } from "@/lib/server/api-utils";
import { getServerRuntimeState } from "@/lib/server/runtime-mode";
import { getTenantReadiness } from "@/lib/tenant-readiness";

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

  try {
    const runtimeState = getServerRuntimeState();
    const readiness = await getTenantReadiness({
      accessProfile: authResult.accessProfile,
      runtime: runtimeState,
    });

    return NextResponse.json(readiness);
  } catch (error) {
    return serverError(
      error,
      "Failed to load tenant readiness.",
      "TENANT_READINESS_FAILED"
    );
  }
}
