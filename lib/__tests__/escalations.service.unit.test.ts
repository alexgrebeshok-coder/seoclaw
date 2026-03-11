import assert from "node:assert/strict";

import type { AIRunRecord, AITaskUpdateDraft } from "@/lib/ai/types";
import type { ServerAIRunEntry } from "@/lib/ai/server-runs";
import {
  getEscalationItemById,
  getEscalationQueueOverview,
  syncEscalationQueue,
  updateEscalationItem,
} from "@/lib/escalations";
import { createWorkReportSignalFixtureBundle } from "@/lib/__tests__/fixtures/work-report-signal-fixtures";

type StoredEscalationItem = {
  id: string;
  sourceType: string;
  sourceRef: string | null;
  entityType: string;
  entityRef: string;
  projectId: string | null;
  projectName: string | null;
  title: string;
  summary: string | null;
  purpose: string | null;
  urgency: string;
  queueStatus: string;
  sourceStatus: string;
  ownerId: string | null;
  ownerName: string | null;
  ownerRole: string | null;
  firstObservedAt: Date;
  lastObservedAt: Date;
  acknowledgedAt: Date | null;
  resolvedAt: Date | null;
  slaTargetAt: Date;
  metadataJson: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function createEscalationStore() {
  const records = new Map<string, StoredEscalationItem>();

  function clone(record: StoredEscalationItem) {
    return {
      ...record,
      firstObservedAt: new Date(record.firstObservedAt),
      lastObservedAt: new Date(record.lastObservedAt),
      acknowledgedAt: record.acknowledgedAt ? new Date(record.acknowledgedAt) : null,
      resolvedAt: record.resolvedAt ? new Date(record.resolvedAt) : null,
      slaTargetAt: new Date(record.slaTargetAt),
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
    };
  }

  return {
    async upsert(args: {
      where: {
        sourceType_entityType_entityRef: {
          sourceType: string;
          entityType: string;
          entityRef: string;
        };
      };
      create: Omit<StoredEscalationItem, "id" | "createdAt" | "updatedAt">;
      update: Omit<StoredEscalationItem, "id" | "createdAt" | "updatedAt">;
    }) {
      const existing = Array.from(records.values()).find(
        (record) =>
          record.sourceType === args.where.sourceType_entityType_entityRef.sourceType &&
          record.entityType === args.where.sourceType_entityType_entityRef.entityType &&
          record.entityRef === args.where.sourceType_entityType_entityRef.entityRef
      );

      const now = new Date();
      const next: StoredEscalationItem = existing
        ? {
            ...existing,
            ...args.update,
            updatedAt: now,
          }
        : {
            id: `escalation-${records.size + 1}`,
            ...args.create,
            createdAt: now,
            updatedAt: now,
          };

      records.set(next.id, next);
      return clone(next);
    },
    async findMany(args?: {
      take?: number;
      where?: {
        projectId?: string | null;
        queueStatus?: string;
        sourceType?: string;
        urgency?: string;
      };
    }) {
      let values = Array.from(records.values());

      if (args?.where?.projectId !== undefined) {
        values = values.filter((record) => record.projectId === args.where?.projectId);
      }
      if (args?.where?.queueStatus !== undefined) {
        values = values.filter((record) => record.queueStatus === args.where?.queueStatus);
      }
      if (args?.where?.sourceType !== undefined) {
        values = values.filter((record) => record.sourceType === args.where?.sourceType);
      }
      if (args?.where?.urgency !== undefined) {
        values = values.filter((record) => record.urgency === args.where?.urgency);
      }

      values = values.sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());

      return values.slice(0, args?.take ?? values.length).map(clone);
    },
    async findUnique(args: { where: { id: string } }) {
      const record = records.get(args.where.id);
      return record ? clone(record) : null;
    },
    async update(args: {
      where: { id: string };
      data: Partial<Omit<StoredEscalationItem, "id" | "createdAt" | "updatedAt">>;
    }) {
      const record = records.get(args.where.id);
      if (!record) {
        throw new Error(`Escalation ${args.where.id} not found`);
      }

      const next: StoredEscalationItem = {
        ...record,
        ...args.data,
        updatedAt: new Date(),
      };
      records.set(next.id, next);
      return clone(next);
    },
  };
}

function buildRunEntries() {
  const { blueprints } = createWorkReportSignalFixtureBundle();

  const tasksBlueprint = blueprints.find((blueprint) => blueprint.purpose === "tasks");
  const risksBlueprint = blueprints.find((blueprint) => blueprint.purpose === "risks");
  if (!tasksBlueprint || !risksBlueprint) {
    throw new Error("Expected tasks and risks blueprints.");
  }

  const tasksRun: AIRunRecord = {
    id: "ai-run-tasks-001",
    agentId: tasksBlueprint.input.agent.id,
    title: "Execution patch",
    prompt: tasksBlueprint.input.prompt,
    status: "needs_approval",
    createdAt: "2026-03-11T08:00:00.000Z",
    updatedAt: "2026-03-11T09:00:00.000Z",
    context: tasksBlueprint.input.context.activeContext,
    result: {
      title: "Execution patch ready",
      summary: "Task update package is ready for approval.",
      highlights: [],
      nextSteps: [],
      proposal: {
        id: "proposal-tasks-001",
        type: "update_tasks",
        title: "Execution patch for blocked access permit",
        summary: "Reassign the permit follow-up and tighten the next 24-hour due window.",
        state: "pending",
        tasks: [],
        taskUpdates: [
          {
            taskId: "task-access-permit",
            title: "Confirm access permit",
            assignee: "Maria K.",
            dueDate: "2026-03-12",
            reason: "Permit confirmation blocks the next shift.",
          } satisfies AITaskUpdateDraft,
        ],
      },
    },
  };

  const risksRun: AIRunRecord = {
    id: "ai-run-risks-001",
    agentId: risksBlueprint.input.agent.id,
    title: "Risk additions",
    prompt: risksBlueprint.input.prompt,
    status: "failed",
    createdAt: "2026-03-11T00:00:00.000Z",
    updatedAt: "2026-03-11T01:00:00.000Z",
    context: risksBlueprint.input.context.activeContext,
    errorMessage: "Gateway timeout while generating risk packet.",
    result: {
      title: "Risk packet failed",
      summary: "Gateway timeout while generating risk packet.",
      highlights: [],
      nextSteps: [],
      proposal: null,
    },
  };

  return [
    {
      origin: "mock",
      input: tasksBlueprint.input,
      run: tasksRun,
    },
    {
      origin: "gateway",
      input: risksBlueprint.input,
      run: risksRun,
    },
  ] satisfies ServerAIRunEntry[];
}

async function testQueueOverviewBuildsSlaBacklog() {
  const store = createEscalationStore();
  const runEntries = buildRunEntries();

  const queue = await getEscalationQueueOverview(
    { includeResolved: true, limit: 10 },
    {
      escalationStore: store,
      listRunEntries: async () => runEntries,
      now: () => new Date("2026-03-11T12:00:00.000Z"),
    }
  );

  assert.equal(queue.summary.total, 2);
  assert.equal(queue.summary.breached, 1);
  assert.equal(queue.summary.unassigned, 2);
  assert.equal(queue.items[0]?.urgency, "critical");
  assert.equal(queue.items[0]?.sourceStatus, "failed");
  assert.equal(queue.items[0]?.metadata.runId, "ai-run-risks-001");
  assert.equal(queue.items[1]?.queueStatus, "open");
  assert.equal(queue.items[1]?.sourceStatus, "needs_approval");
  assert.equal(queue.items[1]?.recommendedOwnerRole, "OPS");
}

async function testOwnerAssignmentAndAcknowledgementPersist() {
  const store = createEscalationStore();
  const runEntries = buildRunEntries();

  const queue = await getEscalationQueueOverview(
    { includeResolved: true, limit: 10 },
    {
      escalationStore: store,
      listRunEntries: async () => runEntries,
      now: () => new Date("2026-03-11T12:00:00.000Z"),
    }
  );

  const updated = await updateEscalationItem(
    queue.items[1]!.id,
    {
      ownerId: "member-mk",
      queueStatus: "acknowledged",
    },
    {
      escalationStore: store,
      lookupMember: async (memberId) =>
        memberId === "member-mk"
          ? {
              id: "member-mk",
              name: "Maria K.",
              role: "OPS",
            }
          : null,
      now: () => new Date("2026-03-11T12:15:00.000Z"),
    }
  );

  assert.ok(updated);
  assert.equal(updated?.owner?.name, "Maria K.");
  assert.equal(updated?.queueStatus, "acknowledged");
  assert.equal(updated?.acknowledgedAt, "2026-03-11T12:15:00.000Z");
}

async function testStaleQueueItemsResolveWhenSourceDisappears() {
  const store = createEscalationStore();
  const runEntries = buildRunEntries();

  const queue = await getEscalationQueueOverview(
    { includeResolved: true, limit: 10 },
    {
      escalationStore: store,
      listRunEntries: async () => runEntries,
      now: () => new Date("2026-03-11T12:00:00.000Z"),
    }
  );

  await syncEscalationQueue({
    escalationStore: store,
    listRunEntries: async () => [],
    now: () => new Date("2026-03-11T14:00:00.000Z"),
  });

  const record = await getEscalationItemById(queue.items[0]!.id, {
    escalationStore: store,
    now: () => new Date("2026-03-11T14:00:00.000Z"),
  });

  assert.ok(record);
  assert.equal(record?.queueStatus, "resolved");
  assert.equal(record?.sourceStatus, "resolved");
  assert.equal(record?.slaState, "resolved");
}

async function main() {
  await testQueueOverviewBuildsSlaBacklog();
  await testOwnerAssignmentAndAcknowledgementPersist();
  await testStaleQueueItemsResolveWhenSourceDisappears();
  console.log("PASS escalations.service.unit");
}

void main();
