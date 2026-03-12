import assert from "node:assert/strict";

import {
  getExecutiveExceptionInbox,
  syncExecutiveExceptionInbox,
} from "@/lib/command-center";
import type { EscalationListResult } from "@/lib/escalations";
import type { ReconciliationCasefileListResult } from "@/lib/enterprise-truth";

function createEscalations(): EscalationListResult {
  return {
    syncedAt: "2026-03-12T05:00:00.000Z",
    summary: {
      total: 2,
      open: 1,
      acknowledged: 1,
      resolved: 0,
      critical: 1,
      high: 1,
      dueSoon: 1,
      breached: 0,
      unassigned: 1,
    },
    items: [
      {
        id: "esc-1",
        sourceType: "ai_run:work_report_signal_packet",
        sourceRef: "packet-1",
        entityType: "ai_run",
        entityRef: "run-1",
        projectId: "project-yamal",
        projectName: "Yamal Earthwork Package",
        title: "Approval-gated excavation action",
        summary: "Task proposal is waiting for operator approval.",
        purpose: "task_proposal",
        urgency: "critical",
        queueStatus: "open",
        sourceStatus: "needs_approval",
        owner: null,
        recommendedOwnerRole: "PM",
        firstObservedAt: "2026-03-12T04:00:00.000Z",
        lastObservedAt: "2026-03-12T04:55:00.000Z",
        acknowledgedAt: null,
        resolvedAt: null,
        slaTargetAt: "2026-03-12T06:00:00.000Z",
        slaState: "due_soon",
        ageHours: 1.1,
        metadata: {
          runId: "run-1",
          packetId: "packet-1",
        },
      },
      {
        id: "esc-2",
        sourceType: "ai_run:work_report_signal_packet",
        sourceRef: "packet-2",
        entityType: "ai_run",
        entityRef: "run-2",
        projectId: "project-camp",
        projectName: "Arctic Camp Base",
        title: "Failed schedule rerun",
        summary: "Signal packet failed during apply.",
        purpose: "status_update",
        urgency: "high",
        queueStatus: "acknowledged",
        sourceStatus: "failed",
        owner: {
          id: "member-ops",
          name: "Olga",
          role: "OPS",
        },
        recommendedOwnerRole: "OPS",
        firstObservedAt: "2026-03-12T03:00:00.000Z",
        lastObservedAt: "2026-03-12T04:20:00.000Z",
        acknowledgedAt: "2026-03-12T04:25:00.000Z",
        resolvedAt: null,
        slaTargetAt: "2026-03-12T05:30:00.000Z",
        slaState: "on_track",
        ageHours: 2.1,
        metadata: {
          runId: "run-2",
        },
      },
    ],
    sync: {
      key: "escalation_queue",
      status: "success",
      lastStartedAt: "2026-03-12T04:59:00.000Z",
      lastCompletedAt: "2026-03-12T05:00:00.000Z",
      lastSuccessAt: "2026-03-12T05:00:00.000Z",
      lastError: null,
      lastResultCount: 2,
      metadata: {},
      createdAt: "2026-03-12T05:00:00.000Z",
      updatedAt: "2026-03-12T05:00:00.000Z",
    },
  };
}

function createReconciliation(): ReconciliationCasefileListResult {
  return {
    syncedAt: "2026-03-12T05:05:00.000Z",
    summary: {
      total: 2,
      open: 2,
      resolved: 0,
      corroborated: 0,
      contradictory: 1,
      partial: 1,
      projectCases: 1,
      telemetryGaps: 1,
    },
    cases: [
      {
        id: "case-1",
        key: "project:yamal",
        caseType: "project_case",
        truthStatus: "contradictory",
        resolutionStatus: "open",
        projectId: "project-yamal",
        projectName: "Yamal Earthwork Package",
        financeProjectId: "1c-yamal",
        title: "Yamal Earthwork Package",
        explanation: "Finance and field evidence are both present, but telemetry still mismatches.",
        reasonCodes: ["finance_present", "field_present", "telemetry_unmatched", "finance_over_plan"],
        evidenceRecordIds: ["evidence-1"],
        fusionFactIds: ["fusion-1"],
        telemetryRefs: ["gps-1"],
        finance: {
          projectId: "1c-yamal",
          projectName: "Yamal Earthwork Package",
          reportDate: "2026-03-12T00:00:00.000Z",
          variance: -12,
          variancePercent: -12,
          budgetDeltaStatus: "over_plan",
        },
        field: {
          reportCount: 1,
          fusedFactCount: 1,
          strongestVerificationStatus: "verified",
          latestObservedAt: "2026-03-12T04:30:00.000Z",
        },
        telemetry: {
          entityRefs: ["gps-1"],
          equipmentIds: ["BUL-07"],
          geofenceNames: ["Yamal South Zone"],
          latestObservedAt: "2026-03-12T04:45:00.000Z",
        },
        lastObservedAt: "2026-03-12T04:45:00.000Z",
        createdAt: "2026-03-12T05:05:00.000Z",
        updatedAt: "2026-03-12T05:05:00.000Z",
      },
      {
        id: "case-2",
        key: "telemetry:yard",
        caseType: "telemetry_gap",
        truthStatus: "partial",
        resolutionStatus: "open",
        projectId: null,
        projectName: null,
        financeProjectId: null,
        title: "BUL-07 · Remote Storage Yard",
        explanation: "Telemetry is present without matching field or finance facts.",
        reasonCodes: ["telemetry_present", "finance_missing", "field_missing"],
        evidenceRecordIds: [],
        fusionFactIds: [],
        telemetryRefs: ["gps-2"],
        finance: null,
        field: null,
        telemetry: {
          entityRefs: ["gps-2"],
          equipmentIds: ["BUL-07"],
          geofenceNames: ["Remote Storage Yard"],
          latestObservedAt: "2026-03-12T04:35:00.000Z",
        },
        lastObservedAt: "2026-03-12T04:35:00.000Z",
        createdAt: "2026-03-12T05:05:00.000Z",
        updatedAt: "2026-03-12T05:05:00.000Z",
      },
    ],
    sync: {
      key: "reconciliation_casefiles",
      status: "success",
      lastStartedAt: "2026-03-12T05:04:00.000Z",
      lastCompletedAt: "2026-03-12T05:05:00.000Z",
      lastSuccessAt: "2026-03-12T05:05:00.000Z",
      lastError: null,
      lastResultCount: 2,
      metadata: {},
      createdAt: "2026-03-12T05:05:00.000Z",
      updatedAt: "2026-03-12T05:05:00.000Z",
    },
  };
}

async function testInboxCombinesEscalationsAndReconciliation() {
  const inbox = await getExecutiveExceptionInbox(
    { limit: 10 },
    {
      escalations: createEscalations(),
      reconciliation: createReconciliation(),
    }
  );

  assert.equal(inbox.syncedAt, "2026-03-12T05:05:00.000Z");
  assert.equal(inbox.summary.total, 4);
  assert.equal(inbox.summary.open, 3);
  assert.equal(inbox.summary.acknowledged, 1);
  assert.equal(inbox.summary.critical, 2);
  assert.equal(inbox.summary.high, 1);
  assert.equal(inbox.summary.assigned, 1);
  assert.equal(inbox.summary.unassigned, 0);
  assert.equal(inbox.summary.escalations, 2);
  assert.equal(inbox.summary.reconciliation, 2);

  assert.equal(inbox.items[0]?.layer, "escalation");
  assert.equal(inbox.items[0]?.sourceId, "esc-1");
  assert.equal(inbox.items[0]?.owner.mode, "suggested");
  assert.match(inbox.items[0]?.nextAction ?? "", /Assign an owner/i);

  const contradictory = inbox.items.find((item) => item.sourceId === "case-1");
  assert.equal(contradictory?.urgency, "critical");
  assert.equal(contradictory?.owner.name, "PM follow-through");
  assert.equal(contradictory?.links[0]?.href, "/integrations");

  const telemetryGap = inbox.items.find((item) => item.sourceId === "case-2");
  assert.equal(telemetryGap?.urgency, "medium");
  assert.equal(telemetryGap?.owner.role, "OPS");

  const acknowledged = inbox.items.find((item) => item.sourceId === "esc-2");
  assert.equal(acknowledged?.status, "acknowledged");
  assert.equal(acknowledged?.owner.mode, "assigned");
}

async function testSyncInboxRunsBothUnderlyingSyncs() {
  let escalationSyncCount = 0;
  let reconciliationSyncCount = 0;

  const inbox = await syncExecutiveExceptionInbox(
    { limit: 10 },
    {
      escalations: createEscalations(),
      reconciliation: createReconciliation(),
      syncEscalations: async () => {
        escalationSyncCount += 1;
      },
      syncReconciliation: async () => {
        reconciliationSyncCount += 1;
      },
    }
  );

  assert.equal(escalationSyncCount, 1);
  assert.equal(reconciliationSyncCount, 1);
  assert.equal(inbox.summary.total, 4);
}

async function main() {
  await testInboxCombinesEscalationsAndReconciliation();
  await testSyncInboxRunsBothUnderlyingSyncs();
  console.log("PASS command-center.service.unit");
}

void main();
