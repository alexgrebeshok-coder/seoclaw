import { NextRequest, NextResponse } from "next/server";

import { authorizeRequest } from "@/app/api/middleware/auth";
import { serverError } from "@/lib/server/api-utils";
import { getTenantRolloutPacket } from "@/lib/tenant-rollout-packet";

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
    const packet = await getTenantRolloutPacket({
      accessProfile: authResult.accessProfile,
    });
    const format = request.nextUrl.searchParams.get("format")?.trim().toLowerCase() ?? "json";
    const shouldDownload = request.nextUrl.searchParams.get("download") === "1";

    if (format === "markdown" || format === "md") {
      return new NextResponse(packet.artifact.content, {
        status: 200,
        headers: {
          "Content-Type": `${packet.artifact.mediaType}; charset=utf-8`,
          ...(shouldDownload
            ? {
                "Content-Disposition": `attachment; filename=\"${packet.artifact.fileName}\"`,
              }
            : {}),
        },
      });
    }

    return NextResponse.json(packet);
  } catch (error) {
    return serverError(
      error,
      "Failed to load tenant rollout packet.",
      "TENANT_ROLLOUT_PACKET_FAILED"
    );
  }
}
