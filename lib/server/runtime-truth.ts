import type { WorkflowAuditPack } from "@/lib/audit-packs";
import type { ConnectorStatus, ConnectorStatusSummary } from "@/lib/connectors";
import type { ExceptionInboxResult } from "@/lib/command-center";
import type { GpsTelemetrySampleSnapshot } from "@/lib/connectors/gps-client";
import type { OneCFinanceSampleSnapshot } from "@/lib/connectors/one-c-client";
import type { EscalationListResult } from "@/lib/escalations";
import type { PilotReviewScorecard } from "@/lib/pilot-review";
import type { PilotFeedbackListResult } from "@/lib/pilot-feedback";
import { getPilotControlState, getPilotStageLabel, type PilotControlState } from "@/lib/server/pilot-controls";
import type { TenantOnboardingOverview } from "@/lib/tenant-onboarding";
import type { TenantRolloutPacket } from "@/lib/tenant-rollout-packet";
import type { TenantReadinessReport } from "@/lib/tenant-readiness";
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

function formatAvailabilityCount(input: {
  runtime: ServerRuntimeState;
  value: number;
}) {
  return input.runtime.healthStatus === "degraded" || input.runtime.usingMockData
    ? "Unavailable"
    : String(input.value);
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
  const pilot = getPilotControlState(runtime);
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
      { label: "Pilot rollout", value: formatPilotFact(pilot) },
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
  const pilot = getPilotControlState(runtime);
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
      { label: "Pilot rollout", value: formatPilotFact(pilot) },
    ],
  };
}

export function buildAuditPacksRuntimeTruth(input: {
  candidateCount: number;
  pack: WorkflowAuditPack | null;
  runtime: ServerRuntimeState;
}): OperatorRuntimeTruth {
  const { candidateCount, pack, runtime } = input;
  const pilot = getPilotControlState(runtime);
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
        ? "Audit packs are assembled from persisted workflow runs, evidence, and trace artifacts in the live database."
        : status === "degraded"
          ? "Live audit-pack export was requested, but database-backed workflow state is unavailable."
          : "Demo mode keeps audit-pack export in a safe preview state and avoids claiming live operator history.",
    facts: [
      { label: "Runtime mode", value: describeMode(runtime.dataMode) },
      {
        label: "Workflow ledger",
        value:
          status === "live"
            ? "Live persisted runs"
            : status === "degraded"
              ? "Unavailable"
              : "Demo-safe preview",
      },
      { label: "Exportable workflows", value: String(candidateCount) },
      {
        label: "Current artifact",
        value: pack ? pack.scope.packetLabel ?? pack.scope.runId : "No artifact selected",
      },
      {
        label: "Evidence scope",
        value: pack ? `${pack.evidence.records.length} record${pack.evidence.records.length === 1 ? "" : "s"}` : "No evidence loaded",
      },
      {
        label: "Decision context",
        value: pack ? pack.decision.status : "No decision loaded",
      },
      { label: "Pilot rollout", value: formatPilotFact(pilot) },
    ],
  };
}

export function buildCommandCenterRuntimeTruth(input: {
  inbox: ExceptionInboxResult;
  runtime: ServerRuntimeState;
}): OperatorRuntimeTruth {
  const { inbox, runtime } = input;
  const pilot = getPilotControlState(runtime);
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
      { label: "Pilot rollout", value: formatPilotFact(pilot) },
    ],
  };
}

export function buildPilotControlsRuntimeTruth(input: {
  pilot: PilotControlState;
  runtime: ServerRuntimeState;
}): OperatorRuntimeTruth {
  const { pilot, runtime } = input;
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
        ? "Pilot controls are reading explicit rollout posture and tenant boundaries on top of the live runtime."
        : status === "degraded"
          ? "Pilot controls are configured, but the server runtime is degraded and cannot guarantee live rollout safety."
          : "Pilot controls are visible in preview mode, but live enforcement only matters once live portfolio facts are enabled.",
    facts: [
      { label: "Runtime mode", value: describeMode(runtime.dataMode) },
      { label: "Pilot stage", value: getPilotStageLabel(pilot.stage) },
      {
        label: "Tenant boundary",
        value: pilot.tenantSlug ?? "Unrestricted",
      },
      {
        label: "Live mutations",
        value: pilot.liveMutationAllowed ? "Allowed within posture" : "Guarded",
      },
      {
        label: "Write workspaces",
        value:
          pilot.allowedWriteWorkspaces.length > 0
            ? pilot.allowedWriteWorkspaces.join(", ")
            : "None",
      },
    ],
  };
}

export function buildPilotFeedbackRuntimeTruth(input: {
  feedback: PilotFeedbackListResult;
  runtime: ServerRuntimeState;
}): OperatorRuntimeTruth {
  const { feedback, runtime } = input;
  const pilot = getPilotControlState(runtime);
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
        ? "Pilot feedback is stored as durable product truth linked to real workflow artifacts."
        : status === "degraded"
          ? "Live pilot feedback was requested, but DATABASE_URL is unavailable. The feedback ledger cannot persist real operator follow-through."
          : "Demo mode keeps pilot feedback in preview only. Real feedback logging and closure are intentionally disabled.",
    facts: [
      { label: "Runtime mode", value: describeMode(runtime.dataMode) },
      {
        label: "Feedback items",
        value: `${feedback.summary.total} persisted item${feedback.summary.total === 1 ? "" : "s"}`,
      },
      {
        label: "Still active",
        value: String(feedback.summary.open + feedback.summary.inReview),
      },
      {
        label: "Critical/high",
        value: String(feedback.summary.critical + feedback.summary.high),
      },
      {
        label: "Workflow-linked",
        value: String(feedback.summary.workflowRuns + feedback.summary.exceptionItems + feedback.summary.reconciliationTargets),
      },
      { label: "Pilot rollout", value: formatPilotFact(pilot) },
    ],
  };
}

export function buildTenantReadinessRuntimeTruth(input: {
  readiness: TenantReadinessReport;
  runtime: ServerRuntimeState;
}): OperatorRuntimeTruth {
  const { readiness, runtime } = input;
  const status: OperatorTruthStatus =
    runtime.healthStatus === "degraded"
      ? "degraded"
      : runtime.usingMockData
        ? "demo"
        : readiness.outcome === "ready"
          ? "live"
          : "mixed";

  return {
    status,
    description:
      status === "degraded"
        ? "Live tenant promotion is blocked because the server runtime is degraded and cannot guarantee trustworthy portfolio facts."
        : status === "demo"
          ? "Tenant readiness is visible, but demo or unavailable portfolio facts keep this cutover posture blocked until live operator data is enabled."
          : readiness.outcome === "blocked"
            ? "Portfolio runtime is live, but rollout, connector, or operator follow-through blockers still make this tenant unsafe to promote."
            : readiness.outcome === "guarded"
              ? "Portfolio runtime is live and explicit, but this tenant remains inside a controlled rollout posture before broader cutover."
              : readiness.outcome === "ready_with_warnings"
                ? "Portfolio runtime is live and promotion is close, but remaining warnings still need an explicit acceptance decision."
                : "Portfolio runtime, connector truth, and operator follow-through are aligned for tenant promotion.",
    facts: [
      { label: "Runtime mode", value: describeMode(runtime.dataMode) },
      { label: "Readiness outcome", value: readiness.outcomeLabel },
      { label: "Tenant scope", value: readiness.tenant.slug },
      {
        label: "Pilot posture",
        value: readiness.posture.tenantSlug
          ? `${readiness.posture.stageLabel} · ${readiness.posture.tenantSlug}`
          : readiness.posture.stageLabel,
      },
      {
        label: "Connector health",
        value: `${readiness.summary.connectorsOk}/${readiness.connectors.length} ok`,
      },
      {
        label: "Open concerns",
        value: formatAvailabilityCount({
          runtime,
          value:
            readiness.summary.unresolvedExceptions + readiness.summary.unresolvedFeedback,
        }),
      },
    ],
  };
}

export function buildPilotReviewRuntimeTruth(input: {
  runtime: ServerRuntimeState;
  scorecard: PilotReviewScorecard;
}): OperatorRuntimeTruth {
  const { runtime, scorecard } = input;
  const status: OperatorTruthStatus =
    runtime.healthStatus === "degraded"
      ? "degraded"
      : runtime.usingMockData
        ? "demo"
        : scorecard.outcome === "ready"
          ? "live"
          : "mixed";

  const activeConcerns = scorecard.summary.openExceptions + scorecard.summary.openFeedback;

  return {
    status,
    description:
      status === "degraded"
        ? "Live pilot review is degraded because the server runtime cannot guarantee trustworthy operator data."
        : status === "demo"
          ? "Pilot review remains deterministic, but it is aggregating demo or unavailable operator layers and should be treated as a blocked rehearsal."
          : scorecard.outcome === "blocked"
            ? "Pilot review is backed by live runtime state, but blocked backlog, freshness, delivery, or readiness signals still prevent a clean governance posture."
            : scorecard.outcome === "guarded"
              ? "Pilot review is live and exportable, but the tenant still remains inside an explicit controlled rollout posture."
              : scorecard.outcome === "ready_with_warnings"
                ? "Pilot review is live and deterministic, but lingering warnings still need explicit acceptance before it becomes a clean baseline."
                : "Pilot review is aggregating live runtime, backlog, delivery, and freshness signals into a clean recurring governance baseline.",
    facts: [
      { label: "Runtime mode", value: describeMode(runtime.dataMode) },
      { label: "Review outcome", value: scorecard.outcomeLabel },
      {
        label: "Sections",
        value: `${scorecard.summary.readySections} ready / ${scorecard.summary.warningSections} warning / ${scorecard.summary.blockedSections} blocked`,
      },
      {
        label: "Active concerns",
        value: formatAvailabilityCount({
          runtime,
          value: activeConcerns,
        }),
      },
      {
        label: "Freshness lag",
        value: `${scorecard.summary.staleSignals} stale signal${scorecard.summary.staleSignals === 1 ? "" : "s"}`,
      },
      {
        label: "Export artifact",
        value: scorecard.artifact.fileName,
      },
    ],
  };
}

export function buildTenantOnboardingRuntimeTruth(input: {
  overview: TenantOnboardingOverview;
  runtime: ServerRuntimeState;
}): OperatorRuntimeTruth {
  const { overview, runtime } = input;
  const activeWarnings =
    overview.currentReadiness.summary.warnings + overview.currentReview.summary.warningSections;
  const latestRunbook = overview.latestRunbook;
  const status: OperatorTruthStatus =
    runtime.healthStatus === "degraded"
      ? "degraded"
      : runtime.usingMockData
        ? "demo"
        : overview.currentReadiness.outcome === "blocked" ||
            overview.currentReview.outcome === "blocked"
          ? "mixed"
          : latestRunbook && latestRunbook.status !== "draft"
            ? "live"
            : "mixed";

  return {
    status,
    description:
      status === "degraded"
        ? "Tenant onboarding is degraded because the server runtime cannot guarantee trustworthy readiness, review, or persistence facts."
        : status === "demo"
          ? "The rollout template is visible, but demo or unavailable operator data means saved onboarding runbooks cannot be treated as live widening state."
          : overview.currentReadiness.outcome === "blocked" ||
              overview.currentReview.outcome === "blocked"
            ? "The rollout runbook is persisted, but the current baseline still has blocked readiness or governance signals."
            : latestRunbook && latestRunbook.status !== "draft"
              ? "The rollout baseline is live and a persisted runbook already carries target-tenant, handoff, and rollback context."
              : "The rollout baseline is live, but the latest handoff is still draft-level or not yet persisted.",
    facts: [
      { label: "Runtime mode", value: describeMode(runtime.dataMode) },
      { label: "Baseline tenant", value: overview.currentReadiness.tenant.slug },
      {
        label: "Current baseline",
        value: `${overview.currentReadiness.outcomeLabel} readiness · ${overview.currentReview.outcomeLabel} review`,
      },
      {
        label: "Latest decision",
        value: overview.latestDecision?.decisionLabel ?? "No decision recorded",
      },
      {
        label: "Latest runbook",
        value: latestRunbook ? latestRunbook.statusLabel : "Not started",
      },
      {
        label: "Saved runbooks",
        value: formatAvailabilityCount({
          runtime,
          value: overview.summary.total,
        }),
      },
      {
        label: "Active warnings",
        value: formatAvailabilityCount({
          runtime,
          value: activeWarnings,
        }),
      },
    ],
    note:
      !overview.persistenceAvailable && runtime.databaseConfigured
        ? "Persistence is disabled for this response even though DATABASE_URL exists."
        : !overview.persistenceAvailable
          ? "Enable DATABASE_URL to turn the rollout template into a durable onboarding handoff."
          : undefined,
  };
}

export function buildTenantRolloutPacketRuntimeTruth(input: {
  packet: TenantRolloutPacket;
  runtime: ServerRuntimeState;
}): OperatorRuntimeTruth {
  const { packet, runtime } = input;
  const activeWarnings =
    packet.currentReadiness.summary.warnings + packet.currentReview.summary.warningSections;
  const latestRunbook = packet.latestRunbook;
  const status: OperatorTruthStatus =
    runtime.healthStatus === "degraded"
      ? "degraded"
      : runtime.usingMockData
        ? "demo"
        : packet.handoff.state === "ready"
          ? "live"
          : "mixed";

  return {
    status,
    description:
      status === "degraded"
        ? "The rollout packet is degraded because the server runtime cannot guarantee trustworthy readiness, governance, or persistence facts."
        : status === "demo"
          ? "The packet surface is visible, but demo or unavailable operator data keeps it in preview-only mode until persisted handoff state is available."
          : packet.handoff.state === "blocked"
            ? "The latest packet is deterministic, but blocked readiness, review, or rollback posture still prevents it from acting as a promotion-ready widening handoff."
            : latestRunbook
              ? "The latest rollout packet is live, deterministic, and backed by a persisted runbook that operators can open or export directly."
              : "The packet surface is live, but it still lacks a persisted runbook-backed handoff for the next tenant conversation.",
    facts: [
      { label: "Runtime mode", value: describeMode(runtime.dataMode) },
      { label: "Handoff state", value: packet.handoff.stateLabel },
      {
        label: "Target tenant",
        value:
          packet.handoff.targetTenantSlug ??
          packet.handoff.targetTenantLabel ??
          packet.currentReadiness.tenant.slug,
      },
      {
        label: "Latest runbook",
        value: latestRunbook ? latestRunbook.statusLabel : "Not started",
      },
      {
        label: "Latest decision",
        value: packet.latestDecision?.decisionLabel ?? "No decision recorded",
      },
      { label: "Artifact", value: packet.artifact.fileName },
      {
        label: "Active warnings",
        value: formatAvailabilityCount({
          runtime,
          value: activeWarnings,
        }),
      },
    ],
    note:
      !packet.persistenceAvailable && runtime.databaseConfigured
        ? "Persistence is disabled for this packet response even though DATABASE_URL exists."
        : !packet.persistenceAvailable
          ? "Enable DATABASE_URL and save a runbook to turn this preview into the latest persisted handoff packet."
          : !latestRunbook
            ? "Create or prepare a tenant onboarding runbook to make this packet runbook-backed."
            : undefined,
  };
}

function formatPilotFact(pilot: PilotControlState) {
  const stage = getPilotStageLabel(pilot.stage);
  return pilot.tenantSlug ? `${stage} · ${pilot.tenantSlug}` : stage;
}
