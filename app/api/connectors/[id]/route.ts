import { NextRequest, NextResponse } from "next/server";

import { authorizeRequest } from "@/app/api/middleware/auth";
import { getConnectorRegistry } from "@/lib/connectors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  const authResult = await authorizeRequest(request, {
    permission: "VIEW_CONNECTORS",
    workspaceId: "executive",
  });
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { id } = await params;
  const connector = await getConnectorRegistry().getStatus(id);

  if (!connector) {
    return NextResponse.json(
      {
        error: `Unknown connector: ${id}`,
      },
      { status: 404 }
    );
  }

  return NextResponse.json(connector);
}
