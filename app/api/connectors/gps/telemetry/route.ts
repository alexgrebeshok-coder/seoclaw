import { NextRequest, NextResponse } from "next/server";

import { authorizeRequest } from "@/app/api/middleware/auth";
import { getGpsTelemetryTruthSnapshot } from "@/lib/connectors/gps-client";

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

  const snapshot = await getGpsTelemetryTruthSnapshot();

  return NextResponse.json(snapshot);
}
