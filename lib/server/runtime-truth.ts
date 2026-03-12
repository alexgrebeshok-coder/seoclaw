import type { ConnectorStatus, ConnectorStatusSummary } from "@/lib/connectors";
import type { ExceptionInboxResult } from "@/lib/command-center";
import type { GpsTelemetrySampleSnapshot } from "@/lib/connectors/gps-client";
import type { OneCFinanceSampleSnapshot } from "@/lib/connectors/one-c-client";
import type { EscalationListResult } from "@/lib/escalations";
import type { DerivedSyncStatus } from "@/lib/sync-state";

import type { ServerRuntimeState } from "./runtime-mode";

type TruthBadgeVariant = "danger" | "info" | "neutral" | "success" | "warning";
export type OperatorTruthStatus = "degraded" | "demo" | "live" | "mixed";

export interface OperatorTruthFact {
  label: string;
  value: string;
}

export interface OperatorRuntimeTruth {
  description: string;
  facts: OperatorTruthFact[];
  note?: string;
  status: OperatorTruthStatus;
}

function describeMode(mode: ServerRuntimeState["dataMode"]) {
  switch (mode) {
    case "demo":
      return "Forced demo";
    case "live":
      return "Forced live";
    default:
      return "Auto";
  }
}

function getSampleLabel(
  label: string,
  status: "degraded" | "ok" | "pending"
) {
  switch (status) {
    case "ok":
      return `${label} live`;
    case "degraded":
      return `${label} degraded`;
    default:
      return `${label} pending`;
  }
}

function getSyncLabel(status: DerivedSyncStatus | "idle") {
  switch (status) {
    case "success":
      return "Fresh";
    case "running":
      return "Running";
    case "error":
      return "Failed";
    case "idle":
    default:
      return "Idle";
  }
}

function resolveVariant(status: OperatorTruthStatus): TruthBadgeVariant {
  switch (status) {
    case "live":
      return "success";
    case "mixed":
      return "warning";
    case "degraded":
      return "danger";
    case "demo":
    default:
      return "info";
  }
}

export function getOperatorTruthBadge(runtimeTruth: OperatorRuntimeTruth): {
  label: string;
  variant: TruthBadgeVariant;
} {
  switch (runtimeTruth.status) {
    case "live":
      return { label: "Live facts", variant: resolveVariant(runtimeTruth.status) };
    case "mixed":
      return { label: "Mixed truth", variant: resolveVariant(runtimeTruth.status) };
    case "degraded":
      return { label: "Live mode degraded", variant: resolveVariant(runtimeTruth.status) };
    case "demo":
    default:
      return { label: "Demo facts", variant: resolveVariant(runtimeTruth.status) };
  }
}

export function buildIntegrationsRuntimeTruth(input: {
  connectorSummary: ConnectorStatusSummary;
  evidenceCount: number;
  gpsSample: GpsTelemetrySampleSnapshot;
  oneCSample: OneCFinanceSampleSnapshot;
  runtime: ServerRuntimeState;
}): OperatorRuntimeTruth {
  const { connectorSummary, evidenceCount, gpsSample, oneCSample, runtime } = input;
  const hasLiveExternalReads =
    connectorSummary.configured > 0 || gpsSample.status === "ok" || oneCSample.status === "ok";
  const status: OperatorTruthStatus =
    runtime.healthStatus === "degraded"
      ? "degraded"
      : runtime.usingMockData
        ? hasLiveExternalReads
          ? "mixed"
          : "demo"
        : "live";

  return {
    status,
    description:
      status === "live"
        ? "Portfolio context and evidence ledger are backed by the live database, while connector probes and truth reads report their own real external state."
        : status === "mixed"
          ? "This page mixes demo portfolio context with live connector probes and read-only truth slices. Treat connector evidence as real and portfolio context as illustrative."
          : status === "degraded"
            ? "APP_DATA_MODE=live is active, but database-backed portfolio context is unavailable. Connector probes may still report their own external health."
            : "This page is currently using demo portfolio context. Any configured external connector truth reads are either unavailable or not confirmed as live yet.",
    facts: [
      { label: "Runtime mode", value: describeMode(runtime.dataMode) },
      {
        label: "Portfolio context",
        value: runtime.usingMockData ? "Demo dataset" : "Live database",
      },
      {
        label: "Connector probes",
        value: `${connectorSummary.configured}/${connectorSummary.total} configured`,
      },
      { label: "GPS truth", value: getSampleLabel("GPS", gpsSample.status) },
      { label: "1C truth", value: getSampleLabel("1C", oneCSample.status) },
      {
        label: "Evidence ledger",
        value: runtime.databaseConfigured ? `${evidenceCount} persisted record${evidenceCount === 1 ? "" : "s"}` : "Unavailable without DB",
      },
    ],
    note:
      runtime.usingMockData && runtime.databaseConfigured
        ? "Demo mode intentionally avoids mixing live work-report evidence into this view."
        : undefined,
  };
}

export function buildWorkReportsRuntimeTruth(input: {
  queue: EscalationListResult | null;
  reportCount: number;
  runtime: ServerRuntimeState;
}): OperatorRuntimeTruth {
  const { queue, reportCount, runtime } = input;
  const status: OperatorTruthStatus =
    runtime.healthStatus === "degraded"
      ? "degraded"
      : runtime.usingMockData
        ? "demo"
        : "live";

  return {
    status,
    description:
      status === "live"
        ? "Work reports, signal packets, and the escalation queue are reading and updating live delivery data."
        : status === "degraded"
          ? "Live delivery workflows are requested, but DATABASE_URL is missing. Report review and escalation actions are unavailable."
          : "Demo mode keeps this workflow in a safe preview state. Live work-report intake, review, and escalation actions are intentionally disabled.",
    facts: [
      { label: "Runtime mode", value: describeMode(runtime.dataMode) },
      {
        label: "Delivery workflow",
        value:
          status === "live"
            ? "Live DB enabled"
            : status === "degraded"
              ? "Unavailable"
              : "Demo-safe preview",
      },
      { label: "Reports visible", value: String(reportCount) },
      {
        label: "Escalation queue",
        value: queue ? `${queue.summary.total} item${queue.summary.total === 1 ? "" : "s"}` : status === "live" ? "0 items" : "Unavailable",
      },
      {
        label: "Signal actions",
        value: status === "live" ? "Create, review, and escalate" : "Blocked outside live DB mode",
      },
    ],
  };
}

export function buildBriefsRuntimeTruth(input: {
  portfolioAlertCount: number;
  projectBriefCount: number;
  runtime: ServerRuntimeState;
  telegramConnector: ConnectorStatus | null;
  emailConnector: ConnectorStatus | null;
}): OperatorRuntimeTruth {
  const {
    portfolioAlertCount,
    projectBriefCount,
    runtime,
    telegramConnector,
    emailConnector,
  } = input;
  const hasLiveOutboundChannel = [telegramConnector, emailConnector].some(
    (connector) => connector !== null && !connector.stub && connector.status === "ok"
  );
  const status: OperatorTruthStatus =
    runtime.healthStatus === "degraded"
      ? "degraded"
      : runtime.usingMockData
        ? hasLiveOutboundChannel
          ? "mixed"
          : "demo"
        : "live";

  return {
    status,
    description:
      status === "live"
        ? "Executive briefs are generated from live portfolio facts, while Telegram and email delivery channels are verified separately as live outbound connectors."
        : status === "mixed"
          ? "Brief content is generated from demo portfolio facts, but at least one outbound delivery channel is live. Preview the facts before sending."
          : status === "degraded"
            ? "Live brief generation was requested, but database-backed portfolio facts are unavailable. Delivery channels may still be configured separately."
            : "Executive briefs are running on demo portfolio facts, and no live outbound channel is currently confirmed for this view.",
    facts: [
      { label: "Runtime mode", value: describeMode(runtime.dataMode) },
      {
        label: "Management facts",
        value: runtime.usingMockData ? "Demo snapshot" : "Live portfolio snapshot",
      },
      {
        label: "Telegram delivery",
        value:
          telegramConnector === null
            ? "Not loaded"
            : telegramConnector.status === "ok"
              ? "Live connector"
              : telegramConnector.status === "degraded"
                ? "Degraded connector"
                : "Pending configuration",
      },
      {
        label: "Email delivery",
        value:
          emailConnector === null
            ? "Not loaded"
            : emailConnector.status === "ok"
              ? "Live connector"
              : emailConnector.status === "degraded"
                ? "Degraded connector"
                : "Pending configuration",
      },
      { label: "Top alerts", value: String(portfolioAlertCount) },
      { label: "Project briefs", value: String(projectBriefCount) },
    ],
  };
}

export function buildCommandCenterRuntimeTruth(input: {
  inbox: ExceptionInboxResult;
  runtime: ServerRuntimeState;
}): OperatorRuntimeTruth {
  const { inbox, runtime } = input;
  const status: OperatorTruthStatus =
    runtime.healthStatus === "degraded"
      ? "degraded"
      : runtime.usingMockData
        ? "demo"
        : "live";

  return {
    status,
    description:
      status === "live"
        ? "The command center is reading live escalation follow-through and reconciliation gaps from one operator inbox."
        : status === "degraded"
          ? "Live operator workflows were requested, but DATABASE_URL is unavailable. The command center cannot manage real exceptions."
          : "Demo mode keeps the command center in preview only. Live exception follow-through and closure are intentionally blocked.",
    facts: [
      { label: "Runtime mode", value: describeMode(runtime.dataMode) },
      {
        label: "Inbox items",
        value: `${inbox.summary.total} loaded exception${inbox.summary.total === 1 ? "" : "s"}`,
      },
      {
        label: "Critical/high",
        value: String(inbox.summary.critical + inbox.summary.high),
      },
      {
        label: "Owned now",
        value: `${inbox.summary.assigned} assigned`,
      },
      {
        label: "Escalation sync",
        value: getSyncLabel(inbox.sync.escalations?.status ?? "idle"),
      },
      {
        label: "Reconciliation sync",
        value: getSyncLabel(inbox.sync.reconciliation?.status ?? "idle"),
      },
    ],
  };
}
