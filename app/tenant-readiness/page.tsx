import { ErrorBoundary } from "@/components/error-boundary";
import { TenantReadinessPage } from "@/components/tenant-readiness/tenant-readiness-page";
import { buildAccessProfile } from "@/lib/auth/access-profile";
import { listCutoverDecisionRegister } from "@/lib/cutover-decisions";
import { getPilotReviewScorecard } from "@/lib/pilot-review";
import { getServerRuntimeState } from "@/lib/server/runtime-mode";
import { buildTenantReadinessRuntimeTruth } from "@/lib/server/runtime-truth";
import { getTenantReadiness } from "@/lib/tenant-readiness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function TenantReadinessRoute() {
  const runtimeState = getServerRuntimeState();
  const accessProfile = buildAccessProfile();
  const readiness = await getTenantReadiness({
    accessProfile,
    runtime: runtimeState,
  });
  const [review, decisionRegister] = await Promise.all([
    getPilotReviewScorecard({
      accessProfile,
      readiness,
      runtime: runtimeState,
    }),
    runtimeState.databaseConfigured
      ? listCutoverDecisionRegister()
      : Promise.resolve({
          entries: [],
          latestDecision: null,
          summary: {
            approvals: 0,
            latestDecisionAt: null,
            latestRollbackAt: null,
            latestWaiverAt: null,
            rollbacks: 0,
            total: 0,
            waivers: 0,
          },
        }),
  ]);
  const runtimeTruth = buildTenantReadinessRuntimeTruth({
    readiness,
    runtime: runtimeState,
  });
  const decisionAvailabilityNote = runtimeState.databaseConfigured
    ? undefined
    : "Cutover governance decisions require DATABASE_URL because approvals, waivers, and rollbacks must be persisted.";

  return (
    <ErrorBoundary resetKey="tenant-readiness">
      <TenantReadinessPage
        currentReviewOutcomeLabel={review.outcomeLabel}
        decisionAvailabilityNote={decisionAvailabilityNote}
        decisionRegister={decisionRegister}
        readiness={readiness}
        runtimeTruth={runtimeTruth}
      />
    </ErrorBoundary>
  );
}
