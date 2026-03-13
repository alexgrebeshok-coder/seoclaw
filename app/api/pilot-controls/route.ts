import { NextRequest, NextResponse } from "next/server";

import { authorizeRequest } from "@/app/api/middleware/auth";
import {
  getPilotControlState,
  getPilotStageLabel,
  getPilotWorkflowLabel,
} from "@/lib/server/pilot-controls";
import { getServerRuntimeState } from "@/lib/server/runtime-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authResult = authorizeRequest(request, {
    permission: "VIEW_WORK_REPORTS",
  });
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const runtimeState = getServerRuntimeState();
  const pilot = getPilotControlState(runtimeState);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    posture: {
      stage: pilot.stage,
      stageLabel: getPilotStageLabel(pilot.stage),
      configured: pilot.configured,
      tenantSlug: pilot.tenantSlug,
      runtimeStatus: pilot.runtimeStatus,
      liveMutationAllowed: pilot.liveMutationAllowed,
    },
    writeWorkspaces: pilot.allowedWriteWorkspaces,
    blockedWorkflows: pilot.blockedWorkflows.map((workflow) => ({
      id: workflow,
      label: getPilotWorkflowLabel(workflow),
    })),
  });
}

