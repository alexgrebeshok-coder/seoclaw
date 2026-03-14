import { NextRequest, NextResponse } from "next/server";

import { authorizeRequest } from "@/app/api/middleware/auth";
import { getPilotReviewScorecard } from "@/lib/pilot-review";
import { serverError } from "@/lib/server/api-utils";
import { getServerRuntimeState } from "@/lib/server/runtime-mode";

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

  try {
    const runtimeState = getServerRuntimeState();
    const scorecard = await getPilotReviewScorecard({
      accessProfile: authResult.accessProfile,
      runtime: runtimeState,
    });
    const format = request.nextUrl.searchParams.get("format")?.trim().toLowerCase() ?? "json";
    const shouldDownload = request.nextUrl.searchParams.get("download") === "1";

    if (format === "markdown" || format === "md") {
      return new NextResponse(scorecard.artifact.content, {
        status: 200,
        headers: {
          "Content-Type": `${scorecard.artifact.mediaType}; charset=utf-8`,
          ...(shouldDownload
            ? {
                "Content-Disposition": `attachment; filename=\"${scorecard.artifact.fileName}\"`,
              }
            : {}),
        },
      });
    }

    return NextResponse.json(scorecard);
  } catch (error) {
    return serverError(error, "Failed to load pilot review.", "PILOT_REVIEW_FAILED");
  }
}
