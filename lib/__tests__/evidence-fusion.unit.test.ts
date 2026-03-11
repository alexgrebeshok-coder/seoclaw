import assert from "node:assert/strict";

import {
  buildEvidenceFusionFacts,
  getEvidenceFusionOverview,
} from "@/lib/evidence";
import type { EvidenceRecordView, EvidenceVerificationStatus } from "@/lib/evidence";

function createRecord(input: {
  id: string;
  title: string;
  sourceType: string;
  entityType: string;
  entityRef: string;
  confidence: number;
  verificationStatus: EvidenceVerificationStatus;
  observedAt: string;
  summary?: string | null;
  projectId?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
}): EvidenceRecordView {
  return {
    id: input.id,
    sourceType: input.sourceType,
    sourceRef: input.entityRef,
    entityType: input.entityType,
    entityRef: input.entityRef,
    projectId: input.projectId ?? "project-1",
    title: input.title,
    summary: input.summary ?? null,
    observedAt: input.observedAt,
    reportedAt: input.observedAt,
    confidence: input.confidence,
    verificationStatus: input.verificationStatus,
    metadata: input.metadata ?? {},
    createdAt: input.observedAt,
    updatedAt: input.observedAt,
  };
}

function createWorkReportRecord(input: {
  id: string;
  status: EvidenceVerificationStatus;
  reportNumber: string;
}) {
  return createRecord({
    id: `evidence-${input.id}`,
    title: `${input.reportNumber} · km 10+000`,
    sourceType: "work_report:manual",
    entityType: "work_report",
    entityRef: input.id,
    confidence: input.status === "verified" ? 0.82 : 0.58,
    verificationStatus: input.status,
    observedAt: "2026-03-11T12:00:00.000Z",
    summary: "Excavation and compaction were completed in the earthwork zone.",
    metadata: {
      equipment: "Excavator",
      projectName: "Yamal Earthwork Package",
      reportDate: "2026-03-11T00:00:00.000Z",
      reportNumber: input.reportNumber,
      reportStatus: input.status === "verified" ? "approved" : "submitted",
      section: "km 10+000",
      workDescription: "Excavation and compaction were completed in the earthwork zone.",
    },
  });
}

function createVideoFactRecord(input: {
  id: string;
  reportId: string;
  status: EvidenceVerificationStatus;
}) {
  return createRecord({
    id: `video-${input.id}`,
    title: "Compaction clip",
    sourceType: "video_document:intake",
    entityType: "video_fact",
    entityRef: input.id,
    confidence: input.status === "verified" ? 0.91 : 0.72,
    verificationStatus: input.status,
    observedAt: "2026-03-11T13:10:00.000Z",
    metadata: {
      reportId: input.reportId,
      reportDate: "2026-03-11T00:00:00.000Z",
      section: "km 10+000",
    },
  });
}

function createGpsRecord(input: {
  id: string;
  observedAt?: string;
  geofenceName?: string;
  equipmentType?: string;
}) {
  return createRecord({
    id: `gps-${input.id}`,
    title: "EXC-KOM-01 · work",
    sourceType: "gps_api:session_sample",
    entityType: "gps_session",
    entityRef: input.id,
    confidence: 0.95,
    verificationStatus: "observed",
    observedAt: input.observedAt ?? "2026-03-11T10:15:00.000Z",
    summary: "Work session inside the earthwork zone.",
    projectId: null,
    metadata: {
      equipmentId: "EXC-KOM-01",
      equipmentType: input.equipmentType ?? "excavator",
      geofenceName: input.geofenceName ?? "Yamal Earthwork Zone",
    },
  });
}

async function testFusionMarksThreeSourceCorroborationAsVerified() {
  const facts = buildEvidenceFusionFacts([
    createWorkReportRecord({ id: "report-1", status: "verified", reportNumber: "#20260311-001" }),
    createVideoFactRecord({ id: "video-1", reportId: "report-1", status: "verified" }),
    createGpsRecord({ id: "gps-1" }),
  ]);

  assert.equal(facts.length, 1);
  assert.equal(facts[0]?.verificationStatus, "verified");
  assert.equal(facts[0]?.sourceCount, 3);
  assert.equal(facts[0]?.confidence, 0.96);
  assert.ok(facts[0]?.explanation.includes("GPS telemetry"));
  assert.ok(facts[0]?.sources[2]?.matchReasons.includes("equipment_overlap"));
}

async function testFusionPromotesReportedFactToObservedWithSingleSupport() {
  const facts = buildEvidenceFusionFacts([
    createWorkReportRecord({ id: "report-2", status: "reported", reportNumber: "#20260311-002" }),
    createVideoFactRecord({ id: "video-2", reportId: "report-2", status: "observed" }),
  ]);

  assert.equal(facts.length, 1);
  assert.equal(facts[0]?.verificationStatus, "observed");
  assert.equal(facts[0]?.sourceCount, 2);
  assert.equal(facts[0]?.confidence, 0.75);
}

async function testFusionIgnoresGpsWithoutCorroboratingSignals() {
  const facts = buildEvidenceFusionFacts([
    createWorkReportRecord({ id: "report-3", status: "reported", reportNumber: "#20260311-003" }),
    createGpsRecord({
      id: "gps-2",
      observedAt: "2026-03-12T10:15:00.000Z",
      geofenceName: "Remote Storage Yard",
      equipmentType: "loader",
    }),
  ]);

  assert.equal(facts.length, 1);
  assert.equal(facts[0]?.verificationStatus, "reported");
  assert.equal(facts[0]?.sourceCount, 1);
  assert.equal(facts[0]?.confidence, 0.58);
}

async function testFusionOverviewSummarizesStatuses() {
  const secondReport = createWorkReportRecord({
    id: "report-2",
    status: "reported",
    reportNumber: "#20260311-002",
  });
  secondReport.title = "#20260311-002 · camp base";
  secondReport.summary = "Storage-yard status update without field equipment.";
  secondReport.metadata = {
    ...secondReport.metadata,
    equipment: "Bulldozer",
    projectName: "Remote Camp Base",
    section: "camp base",
    workDescription: "Storage-yard status update without field equipment.",
  };

  const overview = await getEvidenceFusionOverview(
    { limit: 5 },
    {
      evidence: {
        syncedAt: "2026-03-11T14:00:00.000Z",
        summary: {
          total: 5,
          reported: 1,
          observed: 3,
          verified: 1,
          averageConfidence: 0.8,
          lastObservedAt: "2026-03-11T14:00:00.000Z",
        },
        records: [
          createWorkReportRecord({ id: "report-1", status: "verified", reportNumber: "#20260311-001" }),
          createVideoFactRecord({ id: "video-1", reportId: "report-1", status: "verified" }),
          createGpsRecord({ id: "gps-1" }),
          secondReport,
          createVideoFactRecord({ id: "video-2", reportId: "report-2", status: "observed" }),
        ],
      },
    }
  );

  assert.equal(overview.summary.total, 2);
  assert.equal(overview.summary.reported, 0);
  assert.equal(overview.summary.observed, 1);
  assert.equal(overview.summary.verified, 1);
  assert.equal(overview.summary.averageConfidence, 0.86);
  assert.equal(overview.summary.strongestFactTitle, "#20260311-001 · km 10+000");
}

async function main() {
  await testFusionMarksThreeSourceCorroborationAsVerified();
  await testFusionPromotesReportedFactToObservedWithSingleSupport();
  await testFusionIgnoresGpsWithoutCorroboratingSignals();
  await testFusionOverviewSummarizesStatuses();
  console.log("PASS evidence-fusion.unit");
}

void main();
