import { NextRequest, NextResponse } from "next/server";

import { authorizeRequest } from "@/app/api/middleware/auth";
import { getEvidenceRecordById } from "@/lib/evidence";

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
  const record = await getEvidenceRecordById(id);

  if (!record) {
    return NextResponse.json(
      {
        error: `Unknown evidence record: ${id}`,
      },
      { status: 404 }
    );
  }

  return NextResponse.json(record);
}
