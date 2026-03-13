import { NextRequest, NextResponse } from "next/server";

import { authorizeRequest } from "@/app/api/middleware/auth";
import { deliverBriefByEmail } from "@/lib/briefs/email-delivery";
import {
  badRequest,
  jsonError,
  serverError,
  validationError,
} from "@/lib/server/api-utils";
import { evaluatePilotWorkflowAccess } from "@/lib/server/pilot-controls";
import { getServerRuntimeState } from "@/lib/server/runtime-mode";
import { emailBriefDeliverySchema } from "@/lib/validators/email-brief-delivery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authResult = authorizeRequest(request, {
    permission: "SEND_EMAIL_DIGESTS",
    workspaceId: "executive",
  });
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = await request.json();
    const parsed = emailBriefDeliverySchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const pilotAccess = evaluatePilotWorkflowAccess({
      accessProfile: authResult.accessProfile,
      dryRun: parsed.data.dryRun,
      runtime: getServerRuntimeState(),
      workflow: "executive_delivery",
    });
    if (!pilotAccess.allowed) {
      return jsonError(
        403,
        pilotAccess.code ?? "PILOT_STAGE_BLOCKED",
        pilotAccess.message ?? "Executive delivery is blocked by pilot controls."
      );
    }

    const result = await deliverBriefByEmail(parsed.data);
    return NextResponse.json(result, { status: parsed.data.dryRun ? 200 : 201 });
  } catch (error) {
    if (error instanceof Error && /recipient is required/i.test(error.message)) {
      return badRequest(error.message, "EMAIL_RECIPIENT_REQUIRED");
    }

    if (error instanceof Error && /SMTP is not configured/i.test(error.message)) {
      return jsonError(503, "EMAIL_NOT_CONFIGURED", error.message);
    }

    if (error instanceof Error && /SMTP delivery failed/i.test(error.message)) {
      return jsonError(502, "EMAIL_DELIVERY_FAILED", error.message);
    }

    return serverError(error, "Failed to deliver brief by email.", "EMAIL_BRIEF_DELIVERY_FAILED");
  }
}
