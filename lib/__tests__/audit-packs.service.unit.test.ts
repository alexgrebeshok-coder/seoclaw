import assert from "node:assert/strict";

import {
  getWorkflowAuditPack,
  listWorkflowAuditPackCandidates,
} from "@/lib/audit-packs";
import type { ServerAIRunEntry } from "@/lib/ai/server-runs";
import type { EvidenceFusionOverview, EvidenceListResult } from "@/lib/evidence";
import type { Project } from "@/lib/types";
import type { WorkReportView } from "@/lib/work-reports/types";

function createProject(): Project {
  return {
    id: "project-yamal",
    name: "Yamal Earthwork Package",
    description: "Earthwork and camp preparation",
    status: "active",
    progress: 58,
    direction: "construction",
    budget: {
      planned: 1200000,
      actual: 780000,
      currency: "RUB",
    },
    dates: {
      start: "2026-03-01",
      end: "2026-06-01",
    },
    nextMilestone: {
      name: "Access lane reopened",
      date: "2026-03-13",
    },
    team: ["member-1", "member-2"],
    risks: 2,
    location: "Yamal South Zone",
    priority: "high",
    health: 61,
    objectives: ["Restore access", "Recover excavation cadence"],
    materials: 74,
    laborProductivity: 68,
    safety: { ltifr: 0, trir: 0 },
    history: [],
  };
}

function createWorkflowRunEntry(): ServerAIRunEntry {
  const project = createProject();

  return {
    origin: "mock",
    input: {
      agent: {
        id: "execution-planner",
        kind: "planner",
        nameKey: "nav.analytics",
        accentClass: "from-sky-500 to-cyan-500",
        category: "planning",
        icon: "workflow",
      },
      prompt: "Build the execution patch for the field report and keep the next 72 hours explicit.",
      context: {
        locale: "en",
        interfaceLocale: "en",
        generatedAt: "2026-03-12T06:00:00.000Z",
        activeContext: {
          type: "project",
          pathname: "/projects/project-yamal",
          title: "Yamal Earthwork Package",
          subtitle: "Field signal packet",
          projectId: "project-yamal",
        },
        projects: [project],
        tasks: [],
        team: [],
        risks: [],
        notifications: [],
        project,
        projectTasks: [],
      },
      source: {
        workflow: "work_report_signal_packet",
        purpose: "tasks",
        packetId: "packet-yamal-001",
        packetLabel: "WR-2026-0312 · South trench",
        entityType: "work_report",
        entityId: "report-1",
        entityLabel: "WR-2026-0312 · South trench",
        projectId: "project-yamal",
        projectName: "Yamal Earthwork Package",
      },
    },
    run: {
      id: "run-yamal-1",
      agentId: "execution-planner",
      title: "AI Workspace Run",
      prompt: "Build the execution patch for the field report and keep the next 72 hours explicit.",
      status: "done",
      createdAt: "2026-03-12T06:00:00.000Z",
      updatedAt: "2026-03-12T06:05:00.000Z",
      context: {
        type: "project",
        pathname: "/projects/project-yamal",
        title: "Yamal Earthwork Package",
        subtitle: "Field signal packet",
        projectId: "project-yamal",
      },
      result: {
        title: "Execution patch ready",
        summary: "Task package assembled from the field report.",
        highlights: ["Excavation advanced in the south trench."],
        nextSteps: ["Review the task package and align owners."],
        proposal: {
          id: "proposal-yamal-1",
          type: "update_tasks",
          title: "Update south trench recovery tasks",
          summary: "Three execution updates are ready for approval.",
          state: "applied",
          tasks: [],
          taskUpdates: [
            {
              taskId: "task-1",
              title: "Re-sequence excavator access",
              assignee: "Nikita",
              dueDate: "2026-03-13",
              reason: "Excavation is lagging behind the field report.",
            },
          ],
        },
        actionResult: {
          proposalId: "proposal-yamal-1",
          type: "update_tasks",
          appliedAt: "2026-03-12T06:06:00.000Z",
          summary: "Prepared 1 task update from the approved proposal.",
          itemCount: 1,
          tasksCreated: [],
          tasksUpdated: [
            {
              taskId: "task-1",
              title: "Re-sequence excavator access",
              assignee: "Nikita",
              dueDate: "2026-03-13",
              reason: "Excavation is lagging behind the field report.",
            },
          ],
          tasksRescheduled: [],
          risksRaised: [],
          draftedStatusReport: null,
          notificationsSent: [],
          safety: {
            level: "medium",
            executionMode: "guarded_patch",
            liveMutation: false,
            mutationSurface: "Task drafts",
            checks: ["Review owner and due date against the approved field report."],
            compensationMode: "follow_up_patch",
            compensationSummary: "Issue a corrected update if the applied task patch drifts from field evidence.",
            compensationSteps: ["Review the drafted task change.", "Supersede it with a corrected patch if needed."],
            operatorDecision: "manual_apply",
            postApplyState: "guarded_execution",
          },
        },
      },
    },
  };
}

function createDirectRunEntry(): ServerAIRunEntry {
  const base = createWorkflowRunEntry();
  return {
    ...base,
    input: {
      ...base.input,
      source: {
        workflow: "direct_ai_run",
        entityType: "project",
        entityId: "project-yamal",
        entityLabel: "Yamal Earthwork Package",
      },
    },
    run: {
      ...base.run,
      id: "run-direct-1",
    },
  };
}

function createEvidence(): EvidenceListResult {
  return {
    syncedAt: "2026-03-12T06:07:00.000Z",
    summary: {
      total: 1,
      reported: 0,
      observed: 0,
      verified: 1,
      averageConfidence: 0.82,
      lastObservedAt: "2026-03-12T05:50:00.000Z",
    },
    records: [
      {
        id: "evidence-1",
        sourceType: "work_report:manual",
        sourceRef: "WR-2026-0312",
        entityType: "work_report",
        entityRef: "report-1",
        projectId: "project-yamal",
        title: "WR-2026-0312 · South trench",
        summary: "Excavation advanced with one access blocker still open.",
        observedAt: "2026-03-12T05:50:00.000Z",
        reportedAt: "2026-03-12T05:40:00.000Z",
        confidence: 0.82,
        verificationStatus: "verified",
        metadata: {
          reportNumber: "WR-2026-0312",
        },
        createdAt: "2026-03-12T05:41:00.000Z",
        updatedAt: "2026-03-12T06:07:00.000Z",
      },
    ],
    sync: {
      key: "evidence_ledger",
      status: "success",
      lastStartedAt: "2026-03-12T06:06:00.000Z",
      lastCompletedAt: "2026-03-12T06:07:00.000Z",
      lastSuccessAt: "2026-03-12T06:07:00.000Z",
      lastError: null,
      lastResultCount: 1,
      metadata: {},
      createdAt: "2026-03-12T06:07:00.000Z",
      updatedAt: "2026-03-12T06:07:00.000Z",
    },
  };
}

function createCorroboration(): EvidenceFusionOverview {
  return {
    syncedAt: "2026-03-12T06:07:00.000Z",
    summary: {
      total: 1,
      reported: 0,
      observed: 0,
      verified: 1,
      averageConfidence: 0.87,
      strongestFactTitle: "South trench progress corroborated",
    },
    facts: [
      {
        id: "fusion-1",
        projectId: "project-yamal",
        projectName: "Yamal Earthwork Package",
        title: "South trench progress corroborated",
        reportId: "report-1",
        reportNumber: "WR-2026-0312",
        reportDate: "2026-03-12",
        section: "South trench",
        observedAt: "2026-03-12T05:50:00.000Z",
        confidence: 0.87,
        verificationStatus: "verified",
        explanation: "Work report and linked visual evidence corroborate the same delivery movement.",
        sourceCount: 2,
        sources: [
          {
            recordId: "evidence-1",
            sourceType: "work_report:manual",
            entityType: "work_report",
            entityRef: "report-1",
            title: "WR-2026-0312 · South trench",
            confidence: 0.82,
            verificationStatus: "verified",
            observedAt: "2026-03-12T05:50:00.000Z",
            matchReasons: ["same report"],
          },
        ],
      },
    ],
  };
}

function createWorkReport(): WorkReportView {
  return {
    id: "report-1",
    reportNumber: "WR-2026-0312",
    projectId: "project-yamal",
    project: { id: "project-yamal", name: "Yamal Earthwork Package" },
    authorId: "member-1",
    author: { id: "member-1", name: "Sasha", role: "Foreman" },
    reviewerId: "member-2",
    reviewer: { id: "member-2", name: "Olga", role: "PM" },
    section: "South trench",
    reportDate: "2026-03-12",
    workDescription: "Excavation advanced in the south trench with one blocked access lane.",
    volumes: [],
    personnelCount: 12,
    personnelDetails: null,
    equipment: "EX-14",
    weather: "Snow and wind",
    issues: "Access lane remains blocked by stored aggregate.",
    nextDayPlan: "Clear access lane and continue excavation.",
    attachments: [],
    status: "approved",
    reviewComment: "Approved after PM review.",
    source: "manual",
    externalReporterTelegramId: null,
    externalReporterName: null,
    submittedAt: "2026-03-12T05:40:00.000Z",
    reviewedAt: "2026-03-12T05:55:00.000Z",
    createdAt: "2026-03-12T05:40:00.000Z",
    updatedAt: "2026-03-12T05:55:00.000Z",
  };
}

async function testListWorkflowAuditPackCandidatesFiltersWorkflows() {
  const candidates = await listWorkflowAuditPackCandidates(
    { limit: 10 },
    {
      listRunEntries: async () => [createDirectRunEntry(), createWorkflowRunEntry()],
    }
  );

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0]?.runId, "run-yamal-1");
  assert.equal(candidates[0]?.packetId, "packet-yamal-001");
  assert.equal(candidates[0]?.purposeLabel, "Execution patch");
  assert.equal(candidates[0]?.hasAppliedDecision, true);
}

async function testGetWorkflowAuditPackAssemblesDeterministicArtifact() {
  const pack = await getWorkflowAuditPack("run-yamal-1", {
    getRunEntry: async () => createWorkflowRunEntry(),
    getEvidenceLedger: async () => createEvidence(),
    getEvidenceFusion: async () => createCorroboration(),
    getWorkReport: async () => createWorkReport(),
    now: () => new Date("2026-03-12T06:08:00.000Z"),
  });

  assert.equal(pack.scope.generatedAt, "2026-03-12T06:08:00.000Z");
  assert.equal(pack.decision.status, "applied");
  assert.equal(pack.evidence.records.length, 1);
  assert.equal(pack.corroborationFacts.length, 1);
  assert.equal(pack.workReport?.reportNumber, "WR-2026-0312");
  assert.match(pack.artifact.fileName, /ceoclaw-audit-pack-packet-yamal-001/i);
  assert.match(pack.artifact.content, /## Evidence Ledger/);
  assert.match(pack.artifact.content, /## AI Trace/);
  assert.match(pack.artifact.content, /Prepared 1 task update from the approved proposal\./);
  assert.match(pack.artifact.content, /South trench progress corroborated/);
}

async function main() {
  await testListWorkflowAuditPackCandidatesFiltersWorkflows();
  await testGetWorkflowAuditPackAssemblesDeterministicArtifact();
  console.log("PASS audit-packs.service.unit");
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
