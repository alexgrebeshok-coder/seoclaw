import { ErrorBoundary } from "@/components/error-boundary";
import { TenantRolloutPacketPage } from "@/components/tenant-rollout-packet/tenant-rollout-packet-page";
import { buildAccessProfile } from "@/lib/auth/access-profile";
import { getServerRuntimeState } from "@/lib/server/runtime-mode";
import { buildTenantRolloutPacketRuntimeTruth } from "@/lib/server/runtime-truth";
import { getTenantRolloutPacket } from "@/lib/tenant-rollout-packet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function TenantRolloutPacketRoute() {
  const runtimeState = getServerRuntimeState();
  const accessProfile = buildAccessProfile();
  const packet = await getTenantRolloutPacket({
    accessProfile,
    includePersistedState: runtimeState.databaseConfigured,
  });
  const runtimeTruth = buildTenantRolloutPacketRuntimeTruth({
    packet,
    runtime: runtimeState,
  });
  const availabilityNote = !runtimeState.databaseConfigured
    ? "DATABASE_URL is required for a persisted latest handoff state. This page still assembles a deterministic preview from readiness and review, but it cannot become runbook-backed until persistence is available."
    : !packet.latestRunbook
      ? "No persisted onboarding runbook exists yet. Create or update one in Tenant Onboarding to turn this preview into the latest handoff packet."
      : undefined;

  return (
    <ErrorBoundary resetKey="tenant-rollout-packet">
      <TenantRolloutPacketPage
        availabilityNote={availabilityNote}
        packet={packet}
        runtimeTruth={runtimeTruth}
      />
    </ErrorBoundary>
  );
}
