import { ErrorBoundary } from "@/components/error-boundary";
import { TenantOnboardingPage } from "@/components/tenant-onboarding/tenant-onboarding-page";
import { buildAccessProfile } from "@/lib/auth/access-profile";
import { getServerRuntimeState } from "@/lib/server/runtime-mode";
import { buildTenantOnboardingRuntimeTruth } from "@/lib/server/runtime-truth";
import { getTenantOnboardingOverview } from "@/lib/tenant-onboarding";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function TenantOnboardingRoute() {
  const runtimeState = getServerRuntimeState();
  const accessProfile = buildAccessProfile();
  const overview = await getTenantOnboardingOverview({
    accessProfile,
    includePersistedState: runtimeState.databaseConfigured,
  });
  const runtimeTruth = buildTenantOnboardingRuntimeTruth({
    overview,
    runtime: runtimeState,
  });
  const availabilityNote = runtimeState.databaseConfigured
    ? undefined
    : "Runbook persistence requires DATABASE_URL. The rollout template still renders from readiness, review, and decision inputs, but new runbooks cannot be saved in demo-only mode.";

  return (
    <ErrorBoundary resetKey="tenant-onboarding">
      <TenantOnboardingPage
        availabilityNote={availabilityNote}
        overview={overview}
        runtimeTruth={runtimeTruth}
      />
    </ErrorBoundary>
  );
}
