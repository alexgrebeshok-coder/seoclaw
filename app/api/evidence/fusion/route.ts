import { NextRequest, NextResponse } from "next/server";

import { authorizeRequest } from "@/app/api/middleware/auth";
import { getEvidenceFusionOverview } from "@/lib/evidence";

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
  const limit = Number(searchParams.get("limit") ?? "4");
  const verificationStatus = searchParams.get("verificationStatus") ?? undefined;
  const projectId = searchParams.get("projectId") ?? undefined;

  const overview = await getEvidenceFusionOverview({
    ...(Number.isFinite(limit) ? { limit } : {}),
    ...(projectId ? { projectId } : {}),
    ...(verificationStatus
      ? { verificationStatus: verificationStatus as "reported" | "observed" | "verified" }
      : {}),
  });

  return NextResponse.json(overview);
}
