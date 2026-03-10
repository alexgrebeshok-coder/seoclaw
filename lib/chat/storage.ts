"use client";

import type { AIRunRecord } from "@/lib/ai/types";
import type { ChatSession, PersistedChatState } from "@/lib/chat/types";

const CHAT_STORAGE_KEY = "ceoclaw-chat-sessions-v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildChatSessionTitle(prompt: string) {
  const normalized = prompt.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  return normalized.slice(0, 50);
}

export function createChatSession(
  overrides: Partial<ChatSession> = {}
): ChatSession {
  const timestamp = new Date().toISOString();

  return {
    id: overrides.id ?? createId("chat-session"),
    title: overrides.title ?? "",
    createdAt: overrides.createdAt ?? timestamp,
    updatedAt: overrides.updatedAt ?? timestamp,
    runIds: overrides.runIds ?? [],
  };
}

function isChatSession(value: unknown): value is ChatSession {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    Array.isArray(value.runIds) &&
    value.runIds.every((item) => typeof item === "string")
  );
}

function isAIRunRecord(value: unknown): value is AIRunRecord {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.agentId === "string" &&
    typeof value.title === "string" &&
    typeof value.prompt === "string" &&
    typeof value.status === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    isRecord(value.context) &&
    typeof value.context.type === "string" &&
    typeof value.context.pathname === "string" &&
    typeof value.context.title === "string" &&
    typeof value.context.subtitle === "string"
  );
}

function sortSessions(sessions: ChatSession[]) {
  return [...sessions].sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  );
}

function migrateChatState(raw: PersistedChatState): PersistedChatState | null {
  const runLookup = new Map(raw.runs.map((run) => [run.id, run]));
  const runSessionLookup = new Map<string, string>();

  raw.sessions.forEach((session) => {
    session.runIds.forEach((runId) => runSessionLookup.set(runId, session.id));
  });

  const normalizedRuns = raw.runs.map((run) => ({
    ...run,
    sessionId: run.sessionId ?? runSessionLookup.get(run.id),
  }));

  const validSessions = raw.sessions
    .map((session) => ({
      ...session,
      runIds: session.runIds.filter((runId) => runLookup.has(runId)),
    }))
    .filter((session) => session.runIds.length > 0 || session.title || session.id === raw.currentSessionId);

  if (!validSessions.length && normalizedRuns.length) {
    const sortedRuns = [...normalizedRuns].sort(
      (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    );
    const fallbackSession = createChatSession({
      title: buildChatSessionTitle(sortedRuns[0]?.prompt ?? ""),
      createdAt: sortedRuns[0]?.createdAt,
      updatedAt: sortedRuns[sortedRuns.length - 1]?.updatedAt,
      runIds: sortedRuns.map((run) => run.id),
    });
    const runsWithFallback = normalizedRuns.map((run) => ({
      ...run,
      sessionId: run.sessionId ?? fallbackSession.id,
    }));

    return {
      sessions: [fallbackSession],
      runs: runsWithFallback,
      currentSessionId: fallbackSession.id,
      selectedRunId:
        raw.selectedRunId && runsWithFallback.some((run) => run.id === raw.selectedRunId)
          ? raw.selectedRunId
          : runsWithFallback[0]?.id ?? null,
    };
  }

  if (!validSessions.length) {
    return null;
  }

  const normalizedSessions = sortSessions(validSessions);
  const fallbackSessionId = normalizedSessions[0]?.id ?? null;
  const currentSessionId = normalizedSessions.some((session) => session.id === raw.currentSessionId)
    ? raw.currentSessionId
    : fallbackSessionId;

  return {
    sessions: normalizedSessions,
    runs: normalizedRuns,
    currentSessionId,
    selectedRunId:
      raw.selectedRunId && normalizedRuns.some((run) => run.id === raw.selectedRunId)
        ? raw.selectedRunId
        : null,
  };
}

export function loadPersistedChatState(): PersistedChatState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const sessions = Array.isArray(parsed.sessions)
      ? parsed.sessions.filter(isChatSession)
      : [];
    const runs = Array.isArray(parsed.runs) ? parsed.runs.filter(isAIRunRecord) : [];
    const currentSessionId =
      typeof parsed.currentSessionId === "string" ? parsed.currentSessionId : null;
    const selectedRunId =
      typeof parsed.selectedRunId === "string" ? parsed.selectedRunId : null;

    return migrateChatState({
      sessions,
      runs,
      currentSessionId,
      selectedRunId,
    });
  } catch {
    return null;
  }
}

export function savePersistedChatState(state: PersistedChatState) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota and private-mode storage failures.
  }
}
