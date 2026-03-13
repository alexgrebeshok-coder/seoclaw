import { NextRequest, NextResponse } from "next/server";

import { authorizeRequest } from "@/app/api/middleware/auth";
import { runDueTelegramBriefDeliveryPolicies } from "@/lib/briefs/telegram-delivery-policies";
import { databaseUnavailable, jsonError, serverError } from "@/lib/server/api-utils";
import { evaluatePilotWorkflowAccess } from "@/lib/server/pilot-controls";
import { getServerRuntimeState } from "@/lib/server/runtime-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = authorizeRequest(request, {
      apiKey: process.env.CRON_SECRET,
      permission: "RUN_SCHEDULED_DIGESTS",
      requireApiKey: Boolean(process.env.CRON_SECRET),
      workspaceId: "executive",
    });
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const runtimeState = getServerRuntimeState();
    if (!runtimeState.databaseConfigured) {
      return databaseUnavailable(runtimeState.dataMode);
    }

    const pilotAccess = evaluatePilotWorkflowAccess({
      accessProfile: authResult.accessProfile,
      runtime: runtimeState,
      workflow: "scheduled_delivery",
    });
    if (!pilotAccess.allowed) {
      return jsonError(
        403,
        pilotAccess.code ?? "PILOT_STAGE_BLOCKED",
        pilotAccess.message ?? "Scheduled digest execution is blocked by pilot controls."
      );
    }

    const result = await runDueTelegramBriefDeliveryPolicies();
    return NextResponse.json(result);
  } catch (error) {
    return serverError(error, "Failed to run scheduled Telegram brief deliveries.");
  }
}
