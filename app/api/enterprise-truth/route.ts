import { NextRequest, NextResponse } from "next/server";

import { authorizeRequest } from "@/app/api/middleware/auth";
import { getEnterpriseTruthOverview } from "@/lib/enterprise-truth";
import { parseOptionalInteger } from "@/lib/server/api-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authResult = await authorizeRequest(request, {
    permission: "VIEW_CONNECTORS",
    workspaceId: "executive",
  });
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { searchParams } = request.nextUrl;
  const limit = parseOptionalInteger(searchParams.get("limit")) ?? 6;
  const telemetryLimit = parseOptionalInteger(searchParams.get("telemetryLimit")) ?? 4;
  const projectId = searchParams.get("projectId") ?? undefined;

  const overview = await getEnterpriseTruthOverview({
    limit,
    telemetryLimit,
    ...(projectId ? { projectId } : {}),
  });

  return NextResponse.json(overview);
}
