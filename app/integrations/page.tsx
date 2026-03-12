import { ErrorBoundary } from "@/components/error-boundary";
import { IntegrationsPage } from "@/components/integrations/integrations-page";
import {
  getConnectorRegistry,
  summarizeConnectorStatuses,
} from "@/lib/connectors";
import {
  getEnterpriseTruthOverview,
  getReconciliationCasefiles,
  type ReconciliationCasefileListResult,
} from "@/lib/enterprise-truth";
import { getGpsTelemetryTruthSnapshot } from "@/lib/connectors/gps-client";
import { getOneCFinanceTruthSnapshot } from "@/lib/connectors/one-c-client";
import { getEvidenceFusionOverview, getEvidenceLedgerOverview } from "@/lib/evidence";
import { getServerRuntimeState } from "@/lib/server/runtime-mode";
import { buildIntegrationsRuntimeTruth } from "@/lib/server/runtime-truth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function IntegrationsRoute() {
  const runtimeState = getServerRuntimeState();
  const emptyCasefiles: ReconciliationCasefileListResult = {
    syncedAt: null,
    summary: {
      total: 0,
      open: 0,
      resolved: 0,
      corroborated: 0,
      contradictory: 0,
      partial: 0,
      projectCases: 0,
      telemetryGaps: 0,
    },
    cases: [],
    sync: null,
  };
  const [connectors, gpsTelemetry, oneCFinance, reconciliation] = await Promise.all([
    getConnectorRegistry().getStatuses(),
    getGpsTelemetryTruthSnapshot(),
    getOneCFinanceTruthSnapshot(),
    runtimeState.databaseConfigured
      ? getReconciliationCasefiles({ limit: 24 })
      : Promise.resolve(emptyCasefiles),
  ]);
  const summary = summarizeConnectorStatuses(connectors);
  const evidence = runtimeState.databaseConfigured
    ? await getEvidenceLedgerOverview(
        { limit: 24 },
        {
          gpsSnapshot: gpsTelemetry,
          listReports: runtimeState.usingMockData ? async () => [] : undefined,
        }
      )
    : {
        syncedAt: null,
        summary: {
          total: 0,
          reported: 0,
          observed: 0,
          verified: 0,
          averageConfidence: null,
          lastObservedAt: null,
        },
        records: [],
        sync: null,
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
  const enterpriseTruth = await getEnterpriseTruthOverview(
    { limit: 4, telemetryLimit: 3 },
    {
      evidence,
      fusion,
      gpsSample: gpsTelemetry,
      oneCSample: oneCFinance,
    }
  );
  const runtimeTruth = buildIntegrationsRuntimeTruth({
    connectorSummary: summary,
    evidenceCount: evidence.summary.total,
    gpsSample: gpsTelemetry,
    oneCSample: oneCFinance,
    runtime: runtimeState,
  });

  return (
    <ErrorBoundary resetKey="integrations">
      <IntegrationsPage
        connectors={connectors}
        evidence={evidence}
        enterpriseTruth={enterpriseTruth}
        fusion={fusion}
        gpsTelemetry={gpsTelemetry}
        oneCFinance={oneCFinance}
        reconciliation={reconciliation}
        runtimeTruth={runtimeTruth}
        summary={summary}
      />
    </ErrorBoundary>
  );
}
