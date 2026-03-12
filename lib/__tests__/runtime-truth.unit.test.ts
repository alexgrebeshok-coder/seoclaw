import assert from "node:assert/strict";

import type { ConnectorStatus, ConnectorStatusSummary } from "@/lib/connectors";
import type { EscalationListResult } from "@/lib/escalations";
import type { PilotReviewScorecard } from "@/lib/pilot-review";
import type { ServerRuntimeState } from "@/lib/server/runtime-mode";
import {
  buildBriefsRuntimeTruth,
  buildIntegrationsRuntimeTruth,
  buildPilotReviewRuntimeTruth,
  buildTenantReadinessRuntimeTruth,
  buildWorkReportsRuntimeTruth,
  getOperatorTruthBadge,
} from "@/lib/server/runtime-truth";
import type { TenantReadinessReport } from "@/lib/tenant-readiness";

const connectorSummary: ConnectorStatusSummary = {
  status: "ok",
  total: 4,
  configured: 3,
  ok: 3,
  pending: 1,
  degraded: 0,
};

const telegramConnector: ConnectorStatus = {
  id: "telegram",
  name: "Telegram",
  description: "Telegram connector",
  direction: "outbound",
  sourceSystem: "Telegram Bot API",
  operations: ["delivery"],
  credentials: [],
  apiSurface: [],
  stub: false,
  status: "ok",
  configured: true,
  checkedAt: "2026-03-11T00:00:00.000Z",
  message: "ok",
  missingSecrets: [],
};

const emailConnector: ConnectorStatus = {
  id: "email",
  name: "Email",
  description: "Email connector",
  direction: "outbound",
  sourceSystem: "SMTP",
  operations: ["delivery"],
  credentials: [],
  apiSurface: [],
  stub: false,
  status: "ok",
  configured: true,
  checkedAt: "2026-03-11T00:00:00.000Z",
  message: "ok",
  missingSecrets: [],
};

const demoRuntime: ServerRuntimeState = {
  dataMode: "demo",
  databaseConfigured: true,
  usingMockData: true,
  healthStatus: "ok",
};

const liveRuntime: ServerRuntimeState = {
  dataMode: "live",
  databaseConfigured: true,
  usingMockData: false,
  healthStatus: "ok",
};

const degradedRuntime: ServerRuntimeState = {
  dataMode: "live",
  databaseConfigured: false,
  usingMockData: false,
  healthStatus: "degraded",
};

const queue: EscalationListResult = {
  syncedAt: "2026-03-11T00:00:00.000Z",
  summary: {
    total: 2,
    open: 2,
    acknowledged: 0,
    resolved: 0,
    critical: 1,
    high: 1,
    dueSoon: 0,
    breached: 0,
    unassigned: 2,
  },
  items: [],
  sync: null,
};

const readiness: TenantReadinessReport = {
  accessProfile: {
    organizationSlug: "ceoclaw-demo",
    role: "EXEC",
    workspaceId: "executive",
  },
  blockers: [],
  checklist: [],
  connectorSummary,
  connectors: [telegramConnector, emailConnector],
  generatedAt: "2026-03-12T08:00:00.000Z",
  outcome: "guarded",
  outcomeLabel: "Guarded",
  pilotFeedback: {
    total: 1,
    open: 1,
    inReview: 0,
    resolved: 0,
    critical: 0,
    high: 0,
  },
  posture: {
    blockedWorkflows: [],
    configured: true,
    liveMutationAllowed: true,
    runtimeStatus: "live",
    stage: "controlled",
    stageLabel: "Controlled rollout",
    tenantSlug: "ceoclaw-demo",
    writeWorkspaces: ["delivery", "executive"],
  },
  readySignals: [],
  runtime: liveRuntime,
  summary: {
    blockers: 0,
    connectorsConfigured: 2,
    connectorsDegraded: 0,
    connectorsOk: 2,
    connectorsPending: 0,
    readySignals: 3,
    unresolvedExceptions: 1,
    unresolvedFeedback: 1,
    warnings: 2,
  },
  tenant: {
    label: "Configured pilot tenant",
    slug: "ceoclaw-demo",
    source: "pilot_control",
  },
  unresolvedConcerns: {
    total: 1,
    open: 1,
    acknowledged: 0,
    resolved: 0,
    critical: 0,
    high: 0,
  },
  warnings: [],
};

const pilotReview: PilotReviewScorecard = {
  accessProfile: readiness.accessProfile,
  artifact: {
    content: "# Scorecard\n",
    fileName: "ceoclaw-pilot-review-2026-03-12T08-00-00.000Z.md",
    format: "markdown",
    mediaType: "text/markdown",
  },
  delivery: {
    entries: [],
    failed: 0,
    lastDeliveredAt: "2026-03-12T08:00:00.000Z",
    lastFailureAt: null,
    pending: 0,
    preview: 0,
    stalePending: 0,
    successful: 2,
    total: 2,
  },
  freshness: [],
  generatedAt: "2026-03-12T08:00:00.000Z",
  outcome: "ready_with_warnings",
  outcomeLabel: "Ready with warnings",
  readiness,
  runtime: liveRuntime,
  sections: [],
  summary: {
    blockedSections: 0,
    deliveryFailures: 0,
    openExceptions: 1,
    openFeedback: 1,
    readySections: 4,
    staleSignals: 1,
    warningSections: 1,
  },
};

const integrationsTruth = buildIntegrationsRuntimeTruth({
  connectorSummary,
  evidenceCount: 3,
  gpsSample: {
    id: "gps",
    checkedAt: "2026-03-11T00:00:00.000Z",
    configured: true,
    message: "ok",
    missingSecrets: [],
    sampleUrl: "/api/v1/sessions",
    samples: [],
    status: "ok",
  },
  oneCSample: {
    id: "one-c",
    checkedAt: "2026-03-11T00:00:00.000Z",
    configured: true,
    message: "ok",
    missingSecrets: [],
    sampleUrl: "/api/v1/project-financials",
    samples: [],
    status: "pending",
  },
  runtime: demoRuntime,
});
assert.equal(integrationsTruth.status, "mixed");
assert.equal(getOperatorTruthBadge(integrationsTruth).label, "Mixed truth");

const workReportsTruth = buildWorkReportsRuntimeTruth({
  queue,
  reportCount: 0,
  runtime: demoRuntime,
});
assert.equal(workReportsTruth.status, "demo");
assert.match(workReportsTruth.description, /safe preview/i);

const briefsTruth = buildBriefsRuntimeTruth({
  portfolioAlertCount: 4,
  projectBriefCount: 2,
  runtime: demoRuntime,
  telegramConnector,
  emailConnector,
});
assert.equal(briefsTruth.status, "mixed");
assert.equal(briefsTruth.facts.find((fact) => fact.label === "Email delivery")?.value, "Live connector");

const degradedTruth = buildWorkReportsRuntimeTruth({
  queue: null,
  reportCount: 0,
  runtime: degradedRuntime,
});
assert.equal(degradedTruth.status, "degraded");
assert.equal(getOperatorTruthBadge(degradedTruth).variant, "danger");

const liveBriefsTruth = buildBriefsRuntimeTruth({
  portfolioAlertCount: 2,
  projectBriefCount: 1,
  runtime: liveRuntime,
  telegramConnector,
  emailConnector,
});
assert.equal(liveBriefsTruth.status, "live");

const readinessTruth = buildTenantReadinessRuntimeTruth({
  readiness,
  runtime: liveRuntime,
});
assert.equal(readinessTruth.status, "mixed");
assert.equal(
  readinessTruth.facts.find((fact) => fact.label === "Readiness outcome")?.value,
  "Guarded"
);
assert.equal(
  readinessTruth.facts.find((fact) => fact.label === "Open concerns")?.value,
  "2"
);

const reviewTruth = buildPilotReviewRuntimeTruth({
  runtime: liveRuntime,
  scorecard: pilotReview,
});
assert.equal(reviewTruth.status, "mixed");
assert.equal(
  reviewTruth.facts.find((fact) => fact.label === "Review outcome")?.value,
  "Ready with warnings"
);

const demoReadinessTruth = buildTenantReadinessRuntimeTruth({
  readiness,
  runtime: demoRuntime,
});
assert.equal(
  demoReadinessTruth.facts.find((fact) => fact.label === "Open concerns")?.value,
  "Unavailable"
);

const demoReviewTruth = buildPilotReviewRuntimeTruth({
  runtime: demoRuntime,
  scorecard: pilotReview,
});
assert.equal(
  demoReviewTruth.facts.find((fact) => fact.label === "Active concerns")?.value,
  "Unavailable"
);

console.log("PASS runtime-truth.unit");
