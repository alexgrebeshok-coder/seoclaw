import Link from "next/link";

import { ConnectorHealthTable } from "@/components/integrations/connector-health-table";
import { ConnectorPolicyForm } from "@/components/integrations/connector-policy-form";
import { EvidenceLedgerCard } from "@/components/integrations/evidence-ledger-card";
import { GpsTelemetrySampleCard } from "@/components/integrations/gps-telemetry-sample-card";
import { IntegrationsOverviewCard } from "@/components/integrations/integrations-overview-card";
import { OneCFinanceSampleCard } from "@/components/integrations/one-c-finance-sample-card";
import { DomainApiCard } from "@/components/layout/domain-api-card";
import { DomainPageHeader } from "@/components/layout/domain-page-header";
import { OperatorRuntimeCard } from "@/components/layout/operator-runtime-card";
import { buttonVariants } from "@/components/ui/button";
import type { ConnectorStatus, ConnectorStatusSummary } from "@/lib/connectors";
import type { GpsTelemetrySampleSnapshot } from "@/lib/connectors/gps-client";
import type { OneCFinanceSampleSnapshot } from "@/lib/connectors/one-c-client";
import type { EvidenceListResult } from "@/lib/evidence";
import {
  getOperatorTruthBadge,
  type OperatorRuntimeTruth,
} from "@/lib/server/runtime-truth";

const expectedEndpoints = [
  {
    method: "GET" as const,
    note: "Получить полный registry-backed список connector statuses и summary.",
    path: "/api/connectors",
  },
  {
    method: "GET" as const,
    note: "Получить статус одного connector по его id.",
    path: "/api/connectors/:connectorId",
  },
  {
    method: "GET" as const,
    note: "Прочитать один live GPS telemetry sample через sessions-based read path.",
    path: "/api/connectors/gps/sample",
  },
  {
    method: "GET" as const,
    note: "Прочитать один live 1C finance sample через read-only project financials path.",
    path: "/api/connectors/one-c/sample",
  },
  {
    method: "GET" as const,
    note: "Синхронизировать и получить evidence ledger по work reports и GPS sample.",
    path: "/api/evidence",
  },
  {
    method: "GET" as const,
    note: "Получить один evidence record по id.",
    path: "/api/evidence/:evidenceId",
  },
  {
    method: "GET" as const,
    note: "Проверить общую готовность runtime и агрегированный connector health.",
    path: "/api/health",
  },
];

export function IntegrationsPage({
  connectors,
  evidence,
  gpsSample,
  oneCSample,
  runtimeTruth,
  summary,
}: {
  connectors: ConnectorStatus[];
  evidence: EvidenceListResult;
  gpsSample: GpsTelemetrySampleSnapshot;
  oneCSample: OneCFinanceSampleSnapshot;
  runtimeTruth: OperatorRuntimeTruth;
  summary: ConnectorStatusSummary;
}) {
  const liveConnectors = connectors.filter((connector) => !connector.stub).length;
  const runtimeBadge = getOperatorTruthBadge(runtimeTruth);
  const gpsSampleLabel =
    gpsSample.status === "ok"
      ? "GPS sample live"
      : gpsSample.status === "degraded"
        ? "GPS sample degraded"
        : "GPS sample pending";
  const oneCSampleLabel =
    oneCSample.status === "ok"
      ? "1C sample live"
      : oneCSample.status === "degraded"
        ? "1C sample degraded"
        : "1C sample pending";

  return (
    <div className="grid min-w-0 gap-6">
      <DomainPageHeader
        actions={
          <Link className={buttonVariants({ variant: "outline" })} href="/settings">
            Compare runtime settings
          </Link>
        }
        chips={[
          { label: runtimeBadge.label, variant: runtimeBadge.variant },
          { label: "Registry-backed", variant: "success" },
          { label: summary.pending > 0 ? "Secrets required" : "Configured", variant: summary.pending > 0 ? "warning" : "success" },
          { label: liveConnectors > 0 ? `${liveConnectors} live probe${liveConnectors === 1 ? "" : "s"}` : "Stub adapters", variant: liveConnectors > 0 ? "success" : "info" },
          { label: gpsSampleLabel, variant: gpsSample.status === "ok" ? "success" : gpsSample.status === "degraded" ? "danger" : "warning" },
          { label: oneCSampleLabel, variant: oneCSample.status === "ok" ? "success" : oneCSample.status === "degraded" ? "danger" : "warning" },
          { label: evidence.summary.total > 0 ? `${evidence.summary.total} evidence record${evidence.summary.total === 1 ? "" : "s"}` : "Evidence pending", variant: evidence.summary.total > 0 ? "info" : "warning" },
        ]}
        description="Раздел интеграций подключён к реальному connector registry. Здесь видно, какие коннекторы уже дают live probes, каких secrets не хватает, какой API surface уже подготовлен, какие read-only samples реально приходят из GPS и 1C и как эти факты вместе с visual evidence попадают в evidence ledger."
        eyebrow="Platform trust"
        title="Connector Health"
      />

      <OperatorRuntimeCard truth={runtimeTruth} />

      <IntegrationsOverviewCard summary={summary} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <ConnectorHealthTable connectors={connectors} />
        <div className="grid gap-6">
          <GpsTelemetrySampleCard snapshot={gpsSample} />
          <OneCFinanceSampleCard snapshot={oneCSample} />
          <EvidenceLedgerCard evidence={evidence} />
          <ConnectorPolicyForm connectors={connectors} />
        </div>
      </div>

      <DomainApiCard
        description="Страница уже использует реальные backend endpoints и совпадает с текущим connector framework."
        endpoints={expectedEndpoints}
        title="Backend Endpoints"
      />
    </div>
  );
}
