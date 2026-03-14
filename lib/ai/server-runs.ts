import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { applyAIProposal, hasPendingProposal } from "@/lib/ai/action-engine";
import type { AIApplyProposalInput, AIRunInput, AIRunRecord } from "@/lib/ai/types";
import { invokeOpenClawGateway } from "@/lib/ai/openclaw-gateway";
import { buildMockFinalRun } from "@/lib/ai/mock-adapter";
import { prisma } from "@/lib/prisma";
import { isDatabaseConfigured } from "@/lib/server/runtime-mode";

export type ServerAIRunOrigin = "gateway" | "mock";

export type ServerAIRunEntry = {
  origin: ServerAIRunOrigin;
  input: AIRunInput;
  run: AIRunRecord;
};

const RUN_CACHE_DIR = path.join(process.cwd(), ".ceoclaw-cache", "ai-runs");

function cloneRun(run: AIRunRecord) {
  return JSON.parse(JSON.stringify(run)) as AIRunRecord;
}

function createRunId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `ai-run-${crypto.randomUUID()}`;
  }

  return `ai-run-${Math.random().toString(36).slice(2, 10)}`;
}

function createQueuedGatewayRun(input: AIRunInput, runId: string): AIRunRecord {
  const now = new Date().toISOString();

  return {
    id: runId,
    agentId: input.agent.id,
    title: "AI Workspace Run",
    prompt: input.prompt,
    quickActionId: input.quickAction?.id,
    status: "queued",
    createdAt: now,
    updatedAt: now,
    context: input.context.activeContext,
  };
}

function shouldUseGateway() {
  const mode = process.env.SEOCLAW_AI_MODE;
  if (mode && mode !== "gateway") {
    return false;
  }

  return true;
}

function getRunFile(runId: string) {
  return path.join(RUN_CACHE_DIR, `${runId}.json`);
}

async function persistEntry(entry: ServerAIRunEntry) {
  if (shouldUseDatabaseRunStore()) {
    const ledgerRow = serializeLedgerRow(entry);
    await prisma.aiRunLedger.upsert({
      where: { id: entry.run.id },
      create: ledgerRow,
      update: {
        origin: ledgerRow.origin,
        agentId: ledgerRow.agentId,
        title: ledgerRow.title,
        status: ledgerRow.status,
        quickActionId: ledgerRow.quickActionId,
        projectId: ledgerRow.projectId,
        workflow: ledgerRow.workflow,
        sourceEntityType: ledgerRow.sourceEntityType,
        sourceEntityId: ledgerRow.sourceEntityId,
        inputJson: ledgerRow.inputJson,
        runJson: ledgerRow.runJson,
        runCreatedAt: ledgerRow.runCreatedAt,
        runUpdatedAt: ledgerRow.runUpdatedAt,
      },
    });
    return;
  }

  await mkdir(RUN_CACHE_DIR, { recursive: true });
  await writeFile(getRunFile(entry.run.id), JSON.stringify(entry), "utf8");
}

async function readEntry(runId: string) {
  if (shouldUseDatabaseRunStore()) {
    const record = await prisma.aiRunLedger.findUnique({
      where: { id: runId },
    });
    return record ? deserializeLedgerRow(record) : null;
  }

  try {
    const payload = await readFile(getRunFile(runId), "utf8");
    return JSON.parse(payload) as ServerAIRunEntry;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("ENOENT")) {
      return null;
    }
    throw error;
  }
}

async function listRunIds() {
  if (shouldUseDatabaseRunStore()) {
    const rows = await prisma.aiRunLedger.findMany({
      select: { id: true },
      orderBy: [{ runCreatedAt: "desc" }, { createdAt: "desc" }],
    });
    return rows.map((row) => row.id);
  }

  try {
    const filenames = await readdir(RUN_CACHE_DIR, { withFileTypes: true });
    return filenames
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => entry.name.replace(/\.json$/, ""));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("ENOENT")) {
      return [];
    }
    throw error;
  }
}

function cloneEntry(entry: ServerAIRunEntry) {
  return JSON.parse(JSON.stringify(entry)) as ServerAIRunEntry;
}

async function createMockRun(input: AIRunInput) {
  const runId = createRunId();
  const run = createQueuedGatewayRun(input, runId);
  await persistEntry({
    origin: "mock",
    input,
    run,
  });
  return run;
}

async function executeGatewayRun(runId: string) {
  const entry = await readEntry(runId);
  if (!entry) return;

  const runningAt = new Date().toISOString();
  await persistEntry({
    ...entry,
    run: {
      ...entry.run,
      status: "running",
      updatedAt: runningAt,
    },
  });

  try {
    const result = await invokeOpenClawGateway(entry.input, runId);
    const finalRun: AIRunRecord = {
      ...entry.run,
      status: hasPendingProposal(result) ? "needs_approval" : "done",
      updatedAt: new Date().toISOString(),
      result,
    };

    await persistEntry({
      ...entry,
      run: finalRun,
    });
  } catch (error) {
    // P2-3: Persist failed state instead of fabricating success
    console.error(`AI Run ${runId} failed:`, error);
    
    const failedRun: AIRunRecord = {
      ...entry.run,
      status: "failed",
      updatedAt: new Date().toISOString(),
      result: {
        success: false,
        message: error instanceof Error ? error.message : "AI Gateway error",
      },
    };

    await persistEntry({
      ...entry,
      run: failedRun,
    });
  }
}

async function resolveServerAIRunEntry(runId: string) {
  const entry = await readEntry(runId);
  if (!entry) {
    throw new Error(`AI run ${runId} not found`);
  }

  if (entry.origin === "mock") {
    const nextEntry = resolveMockRunEntry(entry);
    if (hasEntryChanged(entry, nextEntry)) {
      await persistEntry(nextEntry);
    }
    return nextEntry;
  }

  return entry;
}

export async function createServerAIRun(input: AIRunInput) {
  if (!shouldUseGateway()) {
    return createMockRun(input);
  }

  const runId = createRunId();
  const run = createQueuedGatewayRun(input, runId);
  await persistEntry({
    origin: "gateway",
    input,
    run,
  });
  void executeGatewayRun(runId);
  return cloneRun(run);
}

export async function getServerAIRun(runId: string) {
  const entry = await resolveServerAIRunEntry(runId);
  return cloneRun(entry.run);
}

export async function getServerAIRunEntry(runId: string) {
  const entry = await resolveServerAIRunEntry(runId);
  return cloneEntry(entry);
}

export async function listServerAIRunEntries() {
  const runIds = await listRunIds();
  const entries = await Promise.all(
    runIds.map(async (runId) => {
      try {
        return await resolveServerAIRunEntry(runId);
      } catch {
        return null;
      }
    })
  );

  return entries
    .filter((entry): entry is ServerAIRunEntry => entry !== null)
    .sort((left, right) => right.run.createdAt.localeCompare(left.run.createdAt))
    .map(cloneEntry);
}

export async function applyServerAIProposal(input: AIApplyProposalInput) {
  const entry = await resolveServerAIRunEntry(input.runId);
  if (!entry) {
    throw new Error(`AI run ${input.runId} not found`);
  }

  const nextRun = applyAIProposal(entry.run, input.proposalId);
  await persistEntry({
    ...entry,
    run: nextRun,
  });

  return cloneRun(nextRun);
}

function shouldUseDatabaseRunStore(env: NodeJS.ProcessEnv = process.env) {
  return isDatabaseConfigured(env);
}

function resolveMockRunEntry(entry: ServerAIRunEntry) {
  const elapsedMs = Date.now() - Date.parse(entry.run.createdAt);
  const nextUpdatedAt = new Date().toISOString();

  if (entry.run.result?.proposal || entry.run.result?.actionResult || entry.run.status === "done") {
    return entry;
  }

  if (elapsedMs < 550) {
    return entry;
  }

  if (elapsedMs < 1800) {
    if (entry.run.status === "running") {
      return entry;
    }

    return {
      ...entry,
      run: {
        ...entry.run,
        status: "running",
        updatedAt: nextUpdatedAt,
      },
    } satisfies ServerAIRunEntry;
  }

  const finalRun = buildMockFinalRun(entry.input, {
    id: entry.run.id,
    createdAt: entry.run.createdAt,
    updatedAt: nextUpdatedAt,
    quickActionId: entry.run.quickActionId,
  });

  return {
    ...entry,
    run: finalRun,
  } satisfies ServerAIRunEntry;
}

function hasEntryChanged(left: ServerAIRunEntry, right: ServerAIRunEntry) {
  return JSON.stringify(left.run) !== JSON.stringify(right.run);
}

function serializeLedgerRow(entry: ServerAIRunEntry) {
  return {
    id: entry.run.id,
    origin: entry.origin,
    agentId: entry.run.agentId,
    title: entry.run.title,
    status: entry.run.status,
    quickActionId: entry.run.quickActionId ?? null,
    projectId:
      entry.input.source?.projectId ??
      entry.input.context.project?.id ??
      entry.run.context.projectId ??
      null,
    workflow: entry.input.source?.workflow ?? null,
    sourceEntityType: entry.input.source?.entityType ?? null,
    sourceEntityId: entry.input.source?.entityId ?? null,
    inputJson: JSON.stringify(entry.input),
    runJson: JSON.stringify(entry.run),
    runCreatedAt: new Date(entry.run.createdAt),
    runUpdatedAt: new Date(entry.run.updatedAt),
  };
}

function deserializeLedgerRow(row: {
  id: string;
  origin: string;
  inputJson: string;
  runJson: string;
}) {
  return {
    origin: row.origin as ServerAIRunOrigin,
    input: JSON.parse(row.inputJson) as AIRunInput,
    run: JSON.parse(row.runJson) as AIRunRecord,
  } satisfies ServerAIRunEntry;
}
