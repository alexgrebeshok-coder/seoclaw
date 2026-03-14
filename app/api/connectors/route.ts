import { NextRequest, NextResponse } from "next/server";

import { authorizeRequest } from "@/app/api/middleware/auth";
import {
  getConnectorRegistry,
  summarizeConnectorStatuses,
} from "@/lib/connectors";

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

  const connectors = await getConnectorRegistry().getStatuses();
  const summary = summarizeConnectorStatuses(connectors);

  return NextResponse.json({
    status: summary.status,
    timestamp: new Date().toISOString(),
    summary,
    connectors,
  });
}
