import assert from "node:assert/strict";

import {
  createPilotFeedback,
  listPilotFeedback,
  updatePilotFeedback,
  type PilotFeedbackStore,
} from "@/lib/pilot-feedback/service";

type StoredItem = Awaited<ReturnType<PilotFeedbackStore["create"]>>;

function createStore(): PilotFeedbackStore {
  const rows: StoredItem[] = [];
  let sequence = 1;

  return {
    async create({ data }) {
      const item: StoredItem = {
        id: `feedback-${sequence++}`,
        createdAt: data.openedAt,
        updatedAt: data.openedAt,
        ...data,
      };
      rows.push(item);
      return item;
    },
    async findMany({ includeResolved, limit, projectId, status, targetId, targetType }) {
      return rows
        .filter((row) => (includeResolved ? true : row.status !== "resolved"))
        .filter((row) => (projectId ? row.projectId === projectId : true))
        .filter((row) => (status ? row.status === status : true))
        .filter((row) => (targetId ? row.targetId === targetId : true))
        .filter((row) => (targetType ? row.targetType === targetType : true))
        .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())
        .slice(0, limit);
    },
    async findUnique({ id }) {
      return rows.find((row) => row.id === id) ?? null;
    },
    async update({ id, data }) {
      const index = rows.findIndex((row) => row.id === id);
      assert.ok(index >= 0, `row ${id} must exist`);
      const current = rows[index];
      const next: StoredItem = {
        ...current,
        ...data,
        updatedAt: data.resolvedAt ?? new Date("2026-03-12T09:00:00.000Z"),
      };
      rows[index] = next;
      return next;
    },
  };
}

async function testCreateAndListFeedback() {
  const store = createStore();
  const created = await createPilotFeedback(
    {
      details: "The export needs one clearer project label.",
      projectId: "project-yamal",
      projectName: "Yamal Earthwork Package",
      severity: "high",
      sourceHref: "/audit-packs?runId=run-1",
      summary: "Audit pack label is unclear for the pilot reviewer.",
      targetId: "run-1",
      targetLabel: "Yamal packet",
      targetType: "workflow_run",
    },
    {
      now: () => new Date("2026-03-12T08:00:00.000Z"),
      store,
    }
  );

  assert.equal(created.status, "open");
  assert.equal(created.owner.mode, "unassigned");
  assert.equal(created.links[0]?.href, "/audit-packs?runId=run-1");

  const listed = await listPilotFeedback(
    { includeResolved: true, limit: 12 },
    { store }
  );

  assert.equal(listed.summary.total, 1);
  assert.equal(listed.summary.workflowRuns, 1);
  assert.equal(listed.summary.high, 1);
}

async function testAssignAndResolveFeedback() {
  const store = createStore();
  const created = await createPilotFeedback(
    {
      severity: "critical",
      summary: "Command center exception needs clearer next action.",
      targetId: "exception:esc-1",
      targetLabel: "Approval-gated excavation action",
      targetType: "exception_item",
    },
    {
      now: () => new Date("2026-03-12T08:10:00.000Z"),
      store,
    }
  );

  const updated = await updatePilotFeedback(
    created.id,
    {
      ownerId: "member-ops",
      status: "resolved",
    },
    {
      lookupMember: async (memberId) => ({
        id: memberId,
        name: "Olga",
        role: "OPS",
      }),
      now: () => new Date("2026-03-12T09:15:00.000Z"),
      store,
    }
  );

  assert.ok(updated);
  assert.equal(updated?.status, "resolved");
  assert.equal(updated?.owner.mode, "assigned");
  assert.equal(updated?.owner.name, "Olga");
  assert.equal(updated?.resolvedAt, "2026-03-12T09:15:00.000Z");

  const active = await listPilotFeedback({ limit: 12 }, { store });
  assert.equal(active.summary.total, 0);

  const all = await listPilotFeedback({ includeResolved: true, limit: 12 }, { store });
  assert.equal(all.summary.resolved, 1);
}

async function main() {
  await testCreateAndListFeedback();
  await testAssignAndResolveFeedback();
  console.log("PASS pilot-feedback.unit");
}

void main();
