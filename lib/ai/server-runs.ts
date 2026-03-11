import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { applyAIProposal, hasPendingProposal } from "@/lib/ai/action-engine";
import type { AIApplyProposalInput, AIRunInput, AIRunRecord } from "@/lib/ai/types";
import { invokeOpenClawGateway } from "@/lib/ai/openclaw-gateway";
import {
  applyMockProposal,
  buildMockFinalRun,
  createMockAIAdapter,
} from "@/lib/ai/mock-adapter";

export type ServerAIRunOrigin = "gateway" | "mock";

export type ServerAIRunEntry = {
  origin: ServerAIRunOrigin;
  input: AIRunInput;
  run: AIRunRecord;
};

const RUN_CACHE_DIR = path.join(process.cwd(), ".ceoclaw-cache", "ai-runs");
const mockAdapter = createMockAIAdapter();

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
  await mkdir(RUN_CACHE_DIR, { recursive: true });
  await writeFile(getRunFile(entry.run.id), JSON.stringify(entry), "utf8");
}

async function readEntry(runId: string) {
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
  const run = await mockAdapter.runAgent(input);
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
  } catch {
    const fallbackRun = buildMockFinalRun(entry.input, {
      id: runId,
      createdAt: entry.run.createdAt,
      updatedAt: new Date().toISOString(),
      quickActionId: entry.run.quickActionId,
    });

    await persistEntry({
      ...entry,
      run: fallbackRun,
    });
  }
}

async function resolveServerAIRunEntry(runId: string) {
  const entry = await readEntry(runId);
  if (!entry) {
    throw new Error(`AI run ${runId} not found`);
  }

  if (entry.origin === "mock") {
    const liveRun = await mockAdapter.getRun(runId);
    const nextEntry = {
      ...entry,
      run: liveRun,
    } satisfies ServerAIRunEntry;
    await persistEntry(nextEntry);
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
  const entry = await readEntry(input.runId);
  if (!entry) {
    throw new Error(`AI run ${input.runId} not found`);
  }

  const sourceRun =
    entry.origin === "mock" && !entry.run.result?.proposal
      ? buildMockFinalRun(entry.input, {
          id: entry.run.id,
          createdAt: entry.run.createdAt,
          updatedAt: new Date().toISOString(),
          quickActionId: entry.run.quickActionId,
        })
      : entry.origin === "mock"
        ? await mockAdapter.getRun(input.runId)
        : entry.run;
  const nextRun =
    entry.origin === "mock"
      ? applyMockProposal(sourceRun, input.proposalId)
      : applyAIProposal(sourceRun, input.proposalId);
  await persistEntry({
    ...entry,
    run: nextRun,
  });

  return cloneRun(nextRun);
}
