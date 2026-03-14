import { NextRequest, NextResponse } from "next/server";

import { authorizeRequest } from "@/app/api/middleware/auth";
import { runDuePilotReviewDeliveryPolicies } from "@/lib/pilot-review";
import {
  databaseUnavailable,
  jsonError,
  serverError,
  validationError,
} from "@/lib/server/api-utils";
import { evaluatePilotWorkflowAccess } from "@/lib/server/pilot-controls";
import { getServerRuntimeState } from "@/lib/server/runtime-mode";
import { pilotReviewDeliveryRunSchema } from "@/lib/validators/pilot-review-delivery-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authResult = await authorizeRequest(request, {
    permission: "RUN_SCHEDULED_DIGESTS",
    workspaceId: "executive",
  });
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const runtimeState = getServerRuntimeState();
    if (!runtimeState.databaseConfigured) {
      return databaseUnavailable(runtimeState.dataMode);
    }

    const body = await request.json().catch(() => ({}));
    const parsed = pilotReviewDeliveryRunSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const pilotAccess = evaluatePilotWorkflowAccess({
      accessProfile: authResult.accessProfile,
      dryRun: parsed.data.dryRun,
      runtime: runtimeState,
      workflow: "scheduled_delivery",
    });
    if (!pilotAccess.allowed) {
      return jsonError(
        403,
        pilotAccess.code ?? "PILOT_STAGE_BLOCKED",
        pilotAccess.message ?? "Scheduled governance review delivery is blocked by pilot controls."
      );
    }

    const result = await runDuePilotReviewDeliveryPolicies({
      accessProfile: authResult.accessProfile,
      dryRun: parsed.data.dryRun,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && /SMTP is not configured/i.test(error.message)) {
      return jsonError(503, "EMAIL_NOT_CONFIGURED", error.message);
    }

    if (error instanceof Error && /Email recipient is required/i.test(error.message)) {
      return jsonError(400, "EMAIL_RECIPIENT_REQUIRED", error.message);
    }

    if (error instanceof Error && /SMTP delivery failed/i.test(error.message)) {
      return jsonError(502, "EMAIL_DELIVERY_FAILED", error.message);
    }

    return serverError(error, "Failed to run due pilot review deliveries.");
  }
}
