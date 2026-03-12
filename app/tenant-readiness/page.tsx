import { ErrorBoundary } from "@/components/error-boundary";
import { TenantReadinessPage } from "@/components/tenant-readiness/tenant-readiness-page";
import { buildAccessProfile } from "@/lib/auth/access-profile";
import { getServerRuntimeState } from "@/lib/server/runtime-mode";
import { buildTenantReadinessRuntimeTruth } from "@/lib/server/runtime-truth";
import { getTenantReadiness } from "@/lib/tenant-readiness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function TenantReadinessRoute() {
  const runtimeState = getServerRuntimeState();
  const readiness = await getTenantReadiness({
    accessProfile: buildAccessProfile(),
    runtime: runtimeState,
  });
  const runtimeTruth = buildTenantReadinessRuntimeTruth({
    readiness,
    runtime: runtimeState,
  });

  return (
    <ErrorBoundary resetKey="tenant-readiness">
      <TenantReadinessPage readiness={readiness} runtimeTruth={runtimeTruth} />
    </ErrorBoundary>
  );
}
