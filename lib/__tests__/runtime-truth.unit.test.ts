import assert from "node:assert/strict";

import type { ConnectorStatus, ConnectorStatusSummary } from "@/lib/connectors";
import type { EscalationListResult } from "@/lib/escalations";
import type { ServerRuntimeState } from "@/lib/server/runtime-mode";
import {
  buildBriefsRuntimeTruth,
  buildIntegrationsRuntimeTruth,
  buildWorkReportsRuntimeTruth,
  getOperatorTruthBadge,
} from "@/lib/server/runtime-truth";

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

console.log("PASS runtime-truth.unit");
