import { NextRequest, NextResponse } from "next/server";

import { authorizeRequest } from "@/app/api/middleware/auth";
import { updateTenantOnboardingRunbook } from "@/lib/tenant-onboarding";
import {
  badRequest,
  databaseUnavailable,
  notFound,
  serverError,
  validationError,
} from "@/lib/server/api-utils";
import { getServerRuntimeState } from "@/lib/server/runtime-mode";
import { updateTenantOnboardingRunbookSchema } from "@/lib/validators/tenant-onboarding";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(
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

  const runtimeState = getServerRuntimeState();
  if (!runtimeState.databaseConfigured) {
    return databaseUnavailable(runtimeState.dataMode);
  }

  const { id } = await params;
  if (!id) {
    return badRequest("Tenant onboarding runbook id is required.", "TENANT_ONBOARDING_ID_REQUIRED");
  }

  try {
    const rawBody = await request.text();
    if (!rawBody) {
      return badRequest("Request body is required.", "REQUEST_BODY_REQUIRED");
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody) as unknown;
    } catch {
      return badRequest("Request body must be valid JSON.", "INVALID_JSON");
    }

    const parsed = updateTenantOnboardingRunbookSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const updated = await updateTenantOnboardingRunbook(id, parsed.data, {
      accessProfile: authResult.accessProfile,
    });
    if (!updated) {
      return notFound(
        `Tenant onboarding runbook ${id} was not found.`,
        "TENANT_ONBOARDING_NOT_FOUND"
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    return serverError(
      error,
      "Failed to update tenant onboarding runbook.",
      "TENANT_ONBOARDING_UPDATE_FAILED"
    );
  }
}
