import { NextRequest, NextResponse } from "next/server";

import { authorizeRequest } from "@/app/api/middleware/auth";
import { getExecutiveExceptionInbox } from "@/lib/command-center";
import {
  liveOperatorDataUnavailable,
  serverError,
  parseOptionalInteger,
} from "@/lib/server/api-utils";
import {
  getLiveOperatorDataBlockReason,
  getServerRuntimeState,
} from "@/lib/server/runtime-mode";

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

  const runtimeState = getServerRuntimeState();
  if (getLiveOperatorDataBlockReason(runtimeState)) {
    return liveOperatorDataUnavailable(runtimeState);
  }

  const limit = parseOptionalInteger(request.nextUrl.searchParams.get("limit")) ?? 24;
  const includeResolved = request.nextUrl.searchParams.get("includeResolved") === "true";

  try {
    const inbox = await getExecutiveExceptionInbox({
      includeResolved,
      limit,
    });

    return NextResponse.json(inbox);
  } catch (error) {
    return serverError(
      error,
      "Failed to load executive exception inbox.",
      "COMMAND_CENTER_INBOX_FAILED"
    );
  }
}
