import { ErrorBoundary } from "@/components/error-boundary";
import { PilotReviewPage } from "@/components/pilot-review/pilot-review-page";
import { buildAccessProfile } from "@/lib/auth/access-profile";
import {
  getPilotReviewScorecard,
  listPilotReviewDeliveryHistory,
  listPilotReviewDeliveryPolicies,
} from "@/lib/pilot-review";
import { getServerRuntimeState } from "@/lib/server/runtime-mode";
import { buildPilotReviewRuntimeTruth } from "@/lib/server/runtime-truth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PilotReviewRoute() {
  const runtimeState = getServerRuntimeState();
  const accessProfile = buildAccessProfile();
  const [scorecard, deliveryPolicies, deliveryHistory] = await Promise.all([
    getPilotReviewScorecard({
      accessProfile,
      runtime: runtimeState,
    }),
    runtimeState.databaseConfigured
      ? listPilotReviewDeliveryPolicies()
      : Promise.resolve([]),
    runtimeState.databaseConfigured
      ? listPilotReviewDeliveryHistory()
      : Promise.resolve([]),
  ]);
  const runtimeTruth = buildPilotReviewRuntimeTruth({
    runtime: runtimeState,
    scorecard,
  });
  const deliveryAvailabilityNote = runtimeState.databaseConfigured
    ? undefined
    : runtimeState.dataMode === "demo"
      ? "Governance delivery schedules are unavailable in demo-only mode until DATABASE_URL is configured for durable policy and ledger state."
      : "Governance delivery schedules require DATABASE_URL because both policy state and delivery history are persisted.";

  return (
    <ErrorBoundary resetKey="pilot-review">
      <PilotReviewPage
        deliveryAvailabilityNote={deliveryAvailabilityNote}
        deliveryHistory={deliveryHistory}
        deliveryPolicies={deliveryPolicies}
        runtimeTruth={runtimeTruth}
        scorecard={scorecard}
      />
    </ErrorBoundary>
  );
}
