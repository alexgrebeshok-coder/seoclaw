import { ErrorBoundary } from "@/components/error-boundary";
import { PilotControlsPage } from "@/components/pilot-controls/pilot-controls-page";
import { buildPilotControlsRuntimeTruth } from "@/lib/server/runtime-truth";
import {
  getPilotControlState,
  getPilotStageLabel,
  getPilotWorkflowLabel,
} from "@/lib/server/pilot-controls";
import { getServerRuntimeState } from "@/lib/server/runtime-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PilotControlsRoute() {
  const runtimeState = getServerRuntimeState();
  const pilot = getPilotControlState(runtimeState);
  const runtimeTruth = buildPilotControlsRuntimeTruth({
    pilot,
    runtime: runtimeState,
  });

  return (
    <ErrorBoundary resetKey="pilot-controls">
      <PilotControlsPage
        blockedWorkflows={pilot.blockedWorkflows.map((workflow) => ({
          id: workflow,
          label: getPilotWorkflowLabel(workflow),
        }))}
        pilot={pilot}
        runtimeTruth={runtimeTruth}
        stageLabel={getPilotStageLabel(pilot.stage)}
      />
    </ErrorBoundary>
  );
}

