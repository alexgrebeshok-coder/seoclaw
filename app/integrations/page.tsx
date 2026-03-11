import { ErrorBoundary } from "@/components/error-boundary";
import { IntegrationsPage } from "@/components/integrations/integrations-page";
import {
  getConnectorRegistry,
  summarizeConnectorStatuses,
} from "@/lib/connectors";
import { getGpsTelemetrySampleSnapshot } from "@/lib/connectors/gps-client";
import { getOneCFinanceSampleSnapshot } from "@/lib/connectors/one-c-client";
import { getEvidenceFusionOverview, getEvidenceLedgerOverview } from "@/lib/evidence";
import { getServerRuntimeState } from "@/lib/server/runtime-mode";
import { buildIntegrationsRuntimeTruth } from "@/lib/server/runtime-truth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function IntegrationsRoute() {
  const runtimeState = getServerRuntimeState();
  const [connectors, gpsSample, oneCSample] = await Promise.all([
    getConnectorRegistry().getStatuses(),
    getGpsTelemetrySampleSnapshot(),
    getOneCFinanceSampleSnapshot(),
  ]);
  const summary = summarizeConnectorStatuses(connectors);
  const evidence = runtimeState.databaseConfigured
    ? await getEvidenceLedgerOverview(
        { limit: 24 },
        {
          gpsSnapshot: gpsSample,
          listReports: runtimeState.usingMockData ? async () => [] : undefined,
        }
      )
    : {
        syncedAt: new Date().toISOString(),
        summary: {
          total: 0,
          reported: 0,
          observed: 0,
          verified: 0,
          averageConfidence: null,
          lastObservedAt: null,
        },
        records: [],
      };
  const fusion = runtimeState.databaseConfigured
    ? await getEvidenceFusionOverview(
        { limit: 4 },
        {
          evidence,
        }
      )
    : {
        syncedAt: new Date().toISOString(),
        summary: {
          total: 0,
          reported: 0,
          observed: 0,
          verified: 0,
          averageConfidence: null,
          strongestFactTitle: null,
        },
        facts: [],
      };
  const runtimeTruth = buildIntegrationsRuntimeTruth({
    connectorSummary: summary,
    evidenceCount: evidence.summary.total,
    gpsSample,
    oneCSample,
    runtime: runtimeState,
  });

  return (
    <ErrorBoundary resetKey="integrations">
      <IntegrationsPage
        connectors={connectors}
        evidence={evidence}
        fusion={fusion}
        gpsSample={gpsSample}
        oneCSample={oneCSample}
        runtimeTruth={runtimeTruth}
        summary={summary}
      />
    </ErrorBoundary>
  );
}
