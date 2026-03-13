import { NextRequest, NextResponse } from "next/server";

import { authorizeRequest } from "@/app/api/middleware/auth";
import { getWorkflowAuditPack } from "@/lib/audit-packs";
import {
  badRequest,
  liveOperatorDataUnavailable,
  notFound,
  serverError,
} from "@/lib/server/api-utils";
import {
  getLiveOperatorDataBlockReason,
  getServerRuntimeState,
} from "@/lib/server/runtime-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const authResult = authorizeRequest(request, {
    permission: "VIEW_WORK_REPORTS",
    workspaceId: "delivery",
  });
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const runtimeState = getServerRuntimeState();
  if (getLiveOperatorDataBlockReason(runtimeState)) {
    return liveOperatorDataUnavailable(runtimeState);
  }

  const { id } = await params;
  if (!id) {
    return badRequest("Audit-pack workflow id is required.", "AUDIT_PACK_ID_REQUIRED");
  }

  try {
    const pack = await getWorkflowAuditPack(id);
    const format = request.nextUrl.searchParams.get("format")?.trim().toLowerCase() ?? "json";
    const shouldDownload = request.nextUrl.searchParams.get("download") === "1";

    if (format === "markdown" || format === "md") {
      return new NextResponse(pack.artifact.content, {
        status: 200,
        headers: {
          "Content-Type": `${pack.artifact.mediaType}; charset=utf-8`,
          ...(shouldDownload
            ? {
                "Content-Disposition": `attachment; filename=\"${pack.artifact.fileName}\"`,
              }
            : {}),
        },
      });
    }

    return NextResponse.json(pack);
  } catch (error) {
    if (error instanceof Error && /not found/i.test(error.message)) {
      return notFound(error.message, "AUDIT_PACK_NOT_FOUND");
    }

    if (error instanceof Error && /not a supported audit-pack workflow/i.test(error.message)) {
      return badRequest(error.message, "AUDIT_PACK_UNSUPPORTED_WORKFLOW");
    }

    return serverError(error, "Failed to assemble audit pack.", "AUDIT_PACK_FAILED");
  }
}

