import { NextRequest, NextResponse } from "next/server";

import { authorizeRequest } from "@/app/api/middleware/auth";
import { updateTelegramBriefDeliveryPolicy } from "@/lib/briefs/telegram-delivery-policies";
import {
  badRequest,
  databaseUnavailable,
  notFound,
  serverError,
  validationError,
} from "@/lib/server/api-utils";
import { getServerRuntimeState } from "@/lib/server/runtime-mode";
import { telegramBriefDeliveryPolicyUpdateSchema } from "@/lib/validators/telegram-brief-delivery-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const authResult = await authorizeRequest(request, {
    permission: "SEND_TELEGRAM_DIGESTS",
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

    const { id } = await context.params;
    const body = await request.json();
    const parsed = telegramBriefDeliveryPolicyUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const policy = await updateTelegramBriefDeliveryPolicy(id, {
      ...parsed.data,
      updatedByUserId: authResult.accessProfile.userId,
    });

    return NextResponse.json(policy);
  } catch (error) {
    if (error instanceof Error && /delivery policies/i.test(error.message)) {
      return badRequest(error.message, "PROJECT_ID_REQUIRED");
    }

    if (error instanceof Error && /Project not found/i.test(error.message)) {
      return notFound(error.message, "PROJECT_NOT_FOUND");
    }

    if (error instanceof Error && /not found/i.test(error.message)) {
      return notFound(error.message, "TELEGRAM_POLICY_NOT_FOUND");
    }

    return serverError(error, "Failed to update Telegram brief delivery policy.");
  }
}
