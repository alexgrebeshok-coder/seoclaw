import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { AIApplyProposalInput, AIRunInput, AIRunRecord } from "@/lib/ai/types";
import { invokeOpenClawGateway } from "@/lib/ai/openclaw-gateway";
import {
  applyMockProposal,
  buildMockFinalRun,
  createMockAIAdapter,
} from "@/lib/ai/mock-adapter";

type RunOrigin = "gateway" | "mock";

type GatewayRunEntry = {
  origin: RunOrigin;
  input: AIRunInput;
  run: AIRunRecord;
};

const RUN_CACHE_DIR = path.join(process.cwd(), ".seoclaw-cache", "ai-runs");
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

async function persistEntry(entry: GatewayRunEntry) {
  await mkdir(RUN_CACHE_DIR, { recursive: true });
  await writeFile(getRunFile(entry.run.id), JSON.stringify(entry), "utf8");
}

async function readEntry(runId: string) {
  try {
    const payload = await readFile(getRunFile(runId), "utf8");
    return JSON.parse(payload) as GatewayRunEntry;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("ENOENT")) {
      return null;
    }
    throw error;
  }
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
      status: result.proposal ? "needs_approval" : "done",
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
  const entry = await readEntry(runId);
  if (!entry) {
    throw new Error(`AI run ${runId} not found`);
  }

  return cloneRun(entry.run);
}

export async function applyServerAIProposal(input: AIApplyProposalInput) {
  const entry = await readEntry(input.runId);
  if (!entry) {
    throw new Error(`AI run ${input.runId} not found`);
  }

  const proposal = entry.run.result?.proposal;
  if (!proposal || proposal.id !== input.proposalId) {
    throw new Error(`Proposal ${input.proposalId} not found in run ${input.runId}`);
  }

  const nextRun = applyMockProposal(entry.run, input.proposalId);
  await persistEntry({
    ...entry,
    run: nextRun,
  });

  return cloneRun(nextRun);
}
