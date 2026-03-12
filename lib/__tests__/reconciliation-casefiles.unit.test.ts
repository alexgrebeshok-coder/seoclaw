import assert from "node:assert/strict";

import {
  RECONCILIATION_CASEFILE_SYNC_KEY,
  getReconciliationCasefiles,
  syncReconciliationCasefiles,
} from "@/lib/enterprise-truth";
import type { EvidenceFusionOverview, EvidenceListResult, EvidenceRecordView } from "@/lib/evidence";
import type { DerivedSyncMetadata } from "@/lib/sync-state";
import { buildGpsTelemetryTruthSnapshot } from "@/lib/connectors/gps-client";
import { buildOneCFinanceTruthSnapshot } from "@/lib/connectors/one-c-client";

type StoredCasefile = {
  id: string;
  key: string;
  caseType: string;
  truthStatus: string;
  resolutionStatus: string;
  projectId: string | null;
  projectName: string | null;
  financeProjectId: string | null;
  title: string;
  explanation: string;
  reasonCodesJson: string;
  evidenceRecordIdsJson: string;
  fusionFactIdsJson: string;
  telemetryRefsJson: string;
  financeJson: string | null;
  fieldJson: string | null;
  telemetryJson: string | null;
  lastObservedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

type StoredSyncState = {
  key: string;
  status: string;
  lastStartedAt: Date | null;
  lastCompletedAt: Date | null;
  lastSuccessAt: Date | null;
  lastError: string | null;
  lastResultCount: number | null;
  metadataJson: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const WRITE_AT = new Date("2026-03-12T02:40:00.000Z");

function createEvidenceRecord(input: {
  id: string;
  entityType: string;
  entityRef: string;
  projectId?: string | null;
  projectName?: string | null;
  title: string;
  verificationStatus: EvidenceRecordView["verificationStatus"];
  observedAt: string;
  confidence: number;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  return {
    id: input.id,
    sourceType: input.entityType === "gps_session" ? "gps_api:session_sample" : "work_report:manual",
    sourceRef: input.entityRef,
    entityType: input.entityType,
    entityRef: input.entityRef,
    projectId: input.projectId ?? null,
    title: input.title,
    summary: "Synthetic reconciliation evidence.",
    observedAt: input.observedAt,
    reportedAt: input.observedAt,
    confidence: input.confidence,
    verificationStatus: input.verificationStatus,
    metadata: {
      ...(input.projectName ? { projectName: input.projectName } : {}),
      ...(input.metadata ?? {}),
    },
    createdAt: input.observedAt,
    updatedAt: input.observedAt,
  } satisfies EvidenceRecordView;
}

function createEvidence(): EvidenceListResult {
  return {
    syncedAt: "2026-03-12T02:35:00.000Z",
    summary: {
      total: 2,
      reported: 0,
      observed: 1,
      verified: 1,
      averageConfidence: 0.89,
      lastObservedAt: "2026-03-12T02:15:00.000Z",
    },
    records: [
      createEvidenceRecord({
        id: "work-yamal",
        entityType: "work_report",
        entityRef: "report-yamal",
        projectId: "project-yamal",
        projectName: "Yamal Earthwork Package",
        title: "#20260312-001 · Yamal shift",
        verificationStatus: "verified",
        observedAt: "2026-03-12T01:15:00.000Z",
        confidence: 0.93,
      }),
      createEvidenceRecord({
        id: "work-camp",
        entityType: "work_report",
        entityRef: "report-camp",
        projectId: "project-camp",
        projectName: "Arctic Camp Base",
        title: "#20260312-002 · Camp shift",
        verificationStatus: "observed",
        observedAt: "2026-03-12T02:15:00.000Z",
        confidence: 0.84,
      }),
    ],
    sync: null,
  };
}

function createFusion(): EvidenceFusionOverview {
  return {
    syncedAt: "2026-03-12T02:35:00.000Z",
    summary: {
      total: 2,
      reported: 0,
      observed: 1,
      verified: 1,
      averageConfidence: 0.9,
      strongestFactTitle: "#20260312-001 · Yamal shift",
    },
    facts: [
      {
        id: "fusion-yamal",
        projectId: "project-yamal",
        projectName: "Yamal Earthwork Package",
        title: "#20260312-001 · Yamal shift",
        reportId: "report-yamal",
        reportNumber: "#20260312-001",
        reportDate: "2026-03-12T00:00:00.000Z",
        section: "earthwork",
        observedAt: "2026-03-12T01:25:00.000Z",
        confidence: 0.97,
        verificationStatus: "verified",
        explanation: "Matched work report with linked telemetry.",
        sourceCount: 2,
        sources: [
          {
            recordId: "work-yamal",
            sourceType: "work_report:manual",
            entityType: "work_report",
            entityRef: "report-yamal",
            title: "#20260312-001 · Yamal shift",
            confidence: 0.93,
            verificationStatus: "verified",
            observedAt: "2026-03-12T01:15:00.000Z",
            matchReasons: ["anchor_work_report"],
          },
          {
            recordId: "gps-yamal-matched",
            sourceType: "gps_api:session_sample",
            entityType: "gps_session",
            entityRef: "sess-yamal-matched",
            title: "EXC-01 · Yamal Earthwork Zone",
            confidence: 0.95,
            verificationStatus: "observed",
            observedAt: "2026-03-12T01:10:00.000Z",
            matchReasons: ["same_report_day", "location_overlap"],
          },
        ],
      },
      {
        id: "fusion-camp",
        projectId: "project-camp",
        projectName: "Arctic Camp Base",
        title: "#20260312-002 · Camp shift",
        reportId: "report-camp",
        reportNumber: "#20260312-002",
        reportDate: "2026-03-12T00:00:00.000Z",
        section: "camp",
        observedAt: "2026-03-12T02:20:00.000Z",
        confidence: 0.88,
        verificationStatus: "observed",
        explanation: "Field evidence linked without unresolved telemetry.",
        sourceCount: 1,
        sources: [
          {
            recordId: "work-camp",
            sourceType: "work_report:manual",
            entityType: "work_report",
            entityRef: "report-camp",
            title: "#20260312-002 · Camp shift",
            confidence: 0.84,
            verificationStatus: "observed",
            observedAt: "2026-03-12T02:15:00.000Z",
            matchReasons: ["anchor_work_report"],
          },
        ],
      },
    ],
  };
}

function createGpsTruth() {
  return buildGpsTelemetryTruthSnapshot({
    id: "gps",
    checkedAt: "2026-03-12T02:35:00.000Z",
    configured: true,
    status: "ok",
    message: "GPS telemetry truth snapshot ready.",
    missingSecrets: [],
    sampleUrl: "/api/v1/sessions?page_size=12",
    samples: [
      {
        source: "gps",
        sessionId: "sess-yamal-matched",
        equipmentId: "EXC-01",
        equipmentType: "excavator",
        status: "work",
        startedAt: "2026-03-12T00:30:00.000Z",
        endedAt: "2026-03-12T01:10:00.000Z",
        durationSeconds: 2400,
        geofenceId: "gf-yamal-main",
        geofenceName: "Yamal Earthwork Zone",
      },
      {
        source: "gps",
        sessionId: "sess-yamal-gap",
        equipmentId: "BUL-09",
        equipmentType: "bulldozer",
        status: "work",
        startedAt: "2026-03-12T01:40:00.000Z",
        endedAt: "2026-03-12T02:10:00.000Z",
        durationSeconds: 1800,
        geofenceId: "gf-yamal-south",
        geofenceName: "Yamal Earthwork South Zone",
      },
      {
        source: "gps",
        sessionId: "sess-storage-gap",
        equipmentId: "TRK-77",
        equipmentType: "truck",
        status: "work",
        startedAt: "2026-03-12T01:55:00.000Z",
        endedAt: "2026-03-12T02:30:00.000Z",
        durationSeconds: 2100,
        geofenceId: "gf-storage-yard",
        geofenceName: "Remote Storage Yard",
      },
    ],
    metadata: {
      sampleCount: 3,
    },
  });
}

function createOneCTruth() {
  return buildOneCFinanceTruthSnapshot({
    id: "one-c",
    checkedAt: "2026-03-12T02:35:00.000Z",
    configured: true,
    status: "ok",
    message: "1C finance truth snapshot ready.",
    missingSecrets: [],
    sampleUrl: "/api/v1/project-financials?page_size=12",
    samples: [
      {
        source: "one-c",
        projectId: "1c-yamal",
        projectName: "Yamal Earthwork Package",
        status: "active",
        currency: "RUB",
        reportDate: "2026-03-12T00:00:00.000Z",
        plannedBudget: 100,
        actualBudget: 116,
        paymentsActual: 81,
        actsActual: 75,
        variance: -16,
        variancePercent: -16,
      },
      {
        source: "one-c",
        projectId: "1c-camp",
        projectName: "Arctic Camp Base",
        status: "active",
        currency: "RUB",
        reportDate: "2026-03-12T00:00:00.000Z",
        plannedBudget: 80,
        actualBudget: 80,
        paymentsActual: 70,
        actsActual: 68,
        variance: 0,
        variancePercent: 0,
      },
      {
        source: "one-c",
        projectId: "1c-logistics",
        projectName: "Northern Logistics Hub",
        status: "active",
        currency: "RUB",
        reportDate: "2026-03-12T00:00:00.000Z",
        plannedBudget: 120,
        actualBudget: 108,
        paymentsActual: 64,
        actsActual: 61,
        variance: -12,
        variancePercent: -10,
      },
    ],
    metadata: {
      sampleCount: 3,
    },
  });
}

function createFakeCasefileStore() {
  const records = new Map<string, StoredCasefile>();

  const clone = (record: StoredCasefile) => ({
    ...record,
    lastObservedAt: new Date(record.lastObservedAt),
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
  });

  return {
    async deleteMany(args: { where?: { key?: { notIn: string[] } } }) {
      let count = 0;
      const allowedKeys = args.where?.key?.notIn;

      for (const [key] of records.entries()) {
        if (allowedKeys && allowedKeys.includes(key)) {
          continue;
        }

        records.delete(key);
        count += 1;
      }

      return { count };
    },
    async findMany(args: {
      orderBy: { lastObservedAt: "desc" };
      take: number;
      where?: {
        caseType?: string;
        projectId?: string;
        resolutionStatus?: string;
        truthStatus?: string;
      };
    }) {
      return Array.from(records.values())
        .filter((record) => {
          if (args.where?.caseType && record.caseType !== args.where.caseType) return false;
          if (args.where?.projectId && record.projectId !== args.where.projectId) return false;
          if (
            args.where?.resolutionStatus &&
            record.resolutionStatus !== args.where.resolutionStatus
          ) {
            return false;
          }
          if (args.where?.truthStatus && record.truthStatus !== args.where.truthStatus) {
            return false;
          }
          return true;
        })
        .sort((left, right) => right.lastObservedAt.getTime() - left.lastObservedAt.getTime())
        .slice(0, args.take)
        .map(clone);
    },
    async upsert(args: {
      where: { key: string };
      create: { key: string } & Omit<StoredCasefile, "id" | "createdAt" | "updatedAt">;
      update: Omit<StoredCasefile, "id" | "key" | "createdAt" | "updatedAt">;
    }) {
      const existing = records.get(args.where.key);
      const next: StoredCasefile = existing
        ? {
            ...existing,
            ...args.update,
            updatedAt: new Date(WRITE_AT),
          }
        : {
            id: `case-${records.size + 1}`,
            ...args.create,
            createdAt: new Date(WRITE_AT),
            updatedAt: new Date(WRITE_AT),
          };

      records.set(args.where.key, next);
      return clone(next);
    },
    seed(record: StoredCasefile) {
      records.set(record.key, clone(record));
    },
    snapshot() {
      return Array.from(records.values()).map(clone);
    },
  };
}

function createFakeSyncStore() {
  const states = new Map<string, StoredSyncState>();

  const clone = (state: StoredSyncState) => ({
    ...state,
    lastStartedAt: state.lastStartedAt ? new Date(state.lastStartedAt) : null,
    lastCompletedAt: state.lastCompletedAt ? new Date(state.lastCompletedAt) : null,
    lastSuccessAt: state.lastSuccessAt ? new Date(state.lastSuccessAt) : null,
    createdAt: new Date(state.createdAt),
    updatedAt: new Date(state.updatedAt),
  });

  return {
    async findUnique(args: { where: { key: string } }) {
      const state = states.get(args.where.key);
      return state ? clone(state) : null;
    },
    async upsert(args: {
      where: { key: string };
      create: Omit<StoredSyncState, "createdAt" | "updatedAt">;
      update: Omit<StoredSyncState, "key" | "createdAt" | "updatedAt">;
    }) {
      const existing = states.get(args.where.key);
      const next = existing
        ? {
            ...existing,
            ...args.update,
            updatedAt: new Date(WRITE_AT),
          }
        : {
            ...args.create,
            createdAt: new Date(WRITE_AT),
            updatedAt: new Date(WRITE_AT),
          };

      states.set(args.where.key, next);
      return clone(next);
    },
  };
}

async function testSyncBuildsInspectableCasefiles() {
  const casefileStore = createFakeCasefileStore();
  const syncStore = createFakeSyncStore();

  casefileStore.seed({
    id: "case-stale",
    key: "project:stale-case",
    caseType: "project_case",
    truthStatus: "partial",
    resolutionStatus: "open",
    projectId: "stale-project",
    projectName: "Stale project",
    financeProjectId: null,
    title: "Stale project",
    explanation: "Should be removed on sync.",
    reasonCodesJson: JSON.stringify(["stale"]),
    evidenceRecordIdsJson: "[]",
    fusionFactIdsJson: "[]",
    telemetryRefsJson: "[]",
    financeJson: null,
    fieldJson: null,
    telemetryJson: null,
    lastObservedAt: new Date("2026-03-10T00:00:00.000Z"),
    createdAt: new Date("2026-03-10T00:00:00.000Z"),
    updatedAt: new Date("2026-03-10T00:00:00.000Z"),
  });

  await syncReconciliationCasefiles({
    casefileStore,
    evidence: createEvidence(),
    fusion: createFusion(),
    gpsTruth: createGpsTruth(),
    oneCTruth: createOneCTruth(),
    now: () => new Date("2026-03-12T02:35:00.000Z"),
    syncStore,
  });

  const overview = await getReconciliationCasefiles(
    { limit: 10 },
    {
      casefileStore,
      syncStore,
    }
  );

  assert.equal(overview.syncedAt, "2026-03-12T02:35:00.000Z");
  assert.equal(overview.sync?.status, "success");
  assert.equal(overview.sync?.lastResultCount, 4);
  assert.equal((overview.sync?.metadata as DerivedSyncMetadata).gpsStatus, "ok");
  assert.equal((overview.sync?.metadata as DerivedSyncMetadata).oneCStatus, "ok");

  assert.equal(overview.summary.total, 4);
  assert.equal(overview.summary.open, 3);
  assert.equal(overview.summary.resolved, 1);
  assert.equal(overview.summary.corroborated, 1);
  assert.equal(overview.summary.contradictory, 1);
  assert.equal(overview.summary.partial, 2);
  assert.equal(overview.summary.projectCases, 3);
  assert.equal(overview.summary.telemetryGaps, 1);

  const yamal = overview.cases.find((item) => item.projectName === "Yamal Earthwork Package");
  assert.equal(yamal?.truthStatus, "contradictory");
  assert.equal(yamal?.resolutionStatus, "open");
  assert.equal(yamal?.telemetry?.entityRefs.includes("sess-yamal-gap"), true);
  assert.equal(yamal?.finance?.budgetDeltaStatus, "over_plan");
  assert.equal(yamal?.field?.fusedFactCount, 1);
  assert.deepEqual(
    yamal?.reasonCodes,
    ["finance_present", "field_present", "telemetry_unmatched", "finance_over_plan"]
  );

  const camp = overview.cases.find((item) => item.projectName === "Arctic Camp Base");
  assert.equal(camp?.truthStatus, "corroborated");
  assert.equal(camp?.resolutionStatus, "resolved");
  assert.equal(camp?.telemetry, null);

  const logistics = overview.cases.find((item) => item.projectName === "Northern Logistics Hub");
  assert.equal(logistics?.truthStatus, "partial");
  assert.match(logistics?.explanation ?? "", /field evidence has not linked/i);

  const telemetryGap = overview.cases.find((item) => item.caseType === "telemetry_gap");
  assert.equal(telemetryGap?.truthStatus, "partial");
  assert.equal(telemetryGap?.telemetry?.geofenceNames[0], "Remote Storage Yard");
  assert.equal(telemetryGap?.projectName, null);

  assert.equal(
    casefileStore.snapshot().some((record) => record.key === "project:stale-case"),
    false
  );
}

async function testReadFiltersCasefiles() {
  const casefileStore = createFakeCasefileStore();
  const syncStore = createFakeSyncStore();

  await syncReconciliationCasefiles({
    casefileStore,
    evidence: createEvidence(),
    fusion: createFusion(),
    gpsTruth: createGpsTruth(),
    oneCTruth: createOneCTruth(),
    now: () => new Date("2026-03-12T02:35:00.000Z"),
    syncStore,
  });

  const partialOnly = await getReconciliationCasefiles(
    {
      limit: 10,
      truthStatus: "partial",
    },
    {
      casefileStore,
      syncStore,
    }
  );

  assert.equal(partialOnly.sync?.key, RECONCILIATION_CASEFILE_SYNC_KEY);
  assert.equal(partialOnly.summary.total, 2);
  assert.equal(partialOnly.cases.every((item) => item.truthStatus === "partial"), true);
}

async function main() {
  await testSyncBuildsInspectableCasefiles();
  await testReadFiltersCasefiles();
  console.log("PASS reconciliation-casefiles.unit");
}

void main();
