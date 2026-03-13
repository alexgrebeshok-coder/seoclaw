import { ErrorBoundary } from "@/components/error-boundary";
import { AuditPacksPage } from "@/components/audit-packs/audit-packs-page";
import { listWorkflowAuditPackCandidates, getWorkflowAuditPack } from "@/lib/audit-packs";
import {
  buildAuditPacksRuntimeTruth,
} from "@/lib/server/runtime-truth";
import { canReadLiveOperatorData, getServerRuntimeState } from "@/lib/server/runtime-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AuditPacksRoute({
  searchParams,
}: {
  searchParams?: Promise<{ runId?: string }>;
}) {
  const runtimeState = getServerRuntimeState();
  const liveAuditReady = canReadLiveOperatorData(runtimeState);
  const params = (await searchParams) ?? {};

  const candidates = liveAuditReady ? await listWorkflowAuditPackCandidates({ limit: 12 }) : [];
  const selectedRunId = params.runId && candidates.some((item) => item.runId === params.runId)
    ? params.runId
    : candidates[0]?.runId;

  const pack = liveAuditReady && selectedRunId ? await getWorkflowAuditPack(selectedRunId) : null;
  const runtimeTruth = buildAuditPacksRuntimeTruth({
    candidateCount: candidates.length,
    pack,
    runtime: runtimeState,
  });

  return (
    <ErrorBoundary resetKey="audit-packs">
      <AuditPacksPage
        candidates={candidates}
        liveAuditReady={liveAuditReady}
        pack={pack}
        runtimeTruth={runtimeTruth}
      />
    </ErrorBoundary>
  );
}

