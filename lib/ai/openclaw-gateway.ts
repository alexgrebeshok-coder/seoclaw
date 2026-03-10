import { addDays, format } from "date-fns";

import type {
  AIActionProposal,
  AIRunInput,
  AIRunResult,
} from "@/lib/ai/types";
import type { Priority } from "@/lib/types";

const DEFAULT_GATEWAY_URL = "http://127.0.0.1:18789/v1/chat/completions";
const RETRY_DELAYS_MS = [1000, 2000, 4000];
const REQUEST_TIMEOUT_MS = 5 * 60 * 1000;

type ParsedGatewayResult = {
  title: string;
  summary: string;
  highlights: string[];
  nextSteps: string[];
  proposal?: {
    title?: string;
    summary?: string;
    tasks?: Array<Record<string, unknown>>;
  } | null;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const CHAT_COMPLETIONS_PATH = "/v1/chat/completions";

function normalizeGatewayUrl(input?: string | null) {
  const raw = input?.trim() || DEFAULT_GATEWAY_URL;

  try {
    const parsed = new URL(raw);
    if (parsed.protocol === "ws:") parsed.protocol = "http:";
    if (parsed.protocol === "wss:") parsed.protocol = "https:";
    if (parsed.pathname === "/" || parsed.pathname.length === 0) {
      parsed.pathname = CHAT_COMPLETIONS_PATH;
    } else if (!parsed.pathname.endsWith(CHAT_COMPLETIONS_PATH)) {
      parsed.pathname = CHAT_COMPLETIONS_PATH;
    }
    return parsed.toString();
  } catch {
    return DEFAULT_GATEWAY_URL;
  }
}

function parseObject(text: string) {
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

function stripCodeFences(text: string) {
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function normalizePriority(value: unknown): Priority {
  if (value === "low" || value === "medium" || value === "high" || value === "critical") {
    return value;
  }

  return "medium";
}

function normalizeDueDate(value: unknown, index: number) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  return format(addDays(new Date(), index + 2), "yyyy-MM-dd");
}

function ensureStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;

  const normalized = value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim())
    .slice(0, 4);

  return normalized.length ? normalized : fallback;
}

function collectOutputText(value: unknown): string[] {
  if (typeof value === "string") {
    return value.trim().length ? [value] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectOutputText(entry));
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const record = value as Record<string, unknown>;
  const text: string[] = [];

  if (typeof record.text === "string" && record.text.trim().length) {
    text.push(record.text);
  }

  if (typeof record.delta === "string" && record.delta.trim().length) {
    text.push(record.delta);
  }

  // OpenAI Chat Completions format: choices[0].message.content
  if (Array.isArray(record.choices)) {
    const choice = record.choices[0] as Record<string, unknown> | undefined;
    if (choice?.message) {
      const msg = choice.message as Record<string, unknown>;
      if (typeof msg.content === "string" && msg.content.trim().length) {
        text.push(msg.content);
      }
    }
  }

  return [
    ...text,
    ...collectOutputText(record.output),
    ...collectOutputText(record.content),
    ...collectOutputText(record.response),
  ];
}

async function fetchWithRetry(url: string, init: RequestInit, retries = 3): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });

      if (response.ok) {
        clearTimeout(timeoutId);
        return response;
      }

      const responseText = await response.text();
      lastError = new Error(
        responseText.trim().length
          ? `Gateway responded with ${response.status}: ${responseText.slice(0, 500)}`
          : `Gateway responded with ${response.status}`
      );

      if (response.status < 500 && response.status !== 429 && response.status !== 408) {
        clearTimeout(timeoutId);
        throw lastError;
      }
    } catch (error) {
      lastError =
        error instanceof Error
          ? error.name === "AbortError"
            ? new Error("Gateway request timed out.")
            : error
          : new Error(String(error));
    } finally {
      clearTimeout(timeoutId);
    }

    if (attempt < retries - 1) {
      await sleep(RETRY_DELAYS_MS[attempt] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1]);
    }
  }

  throw lastError ?? new Error("Gateway request failed after retries.");
}

async function consumeSseText(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Gateway returned an empty SSE body.");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let eventType = "message";
  let dataLines: string[] = [];
  let terminal = false;
  let failed = false;
  let errorMessage: string | null = null;
  let lastPayload: Record<string, unknown> | null = null;
  const deltas: string[] = [];

  const dispatch = () => {
    if (!dataLines.length) {
      eventType = "message";
      return;
    }

    const data = dataLines.join("\n");
    const trimmed = data.trim();
    const payload = parseObject(trimmed);
    if (payload) {
      lastPayload = payload;
    }

    const payloadType =
      typeof payload?.type === "string" ? payload.type.toLowerCase() : eventType.toLowerCase();
    const payloadStatus =
      typeof payload?.status === "string" ? payload.status.toLowerCase() : null;

    if (trimmed === "[DONE]") {
      terminal = true;
    } else if (
      payloadType.includes("response.output_text.delta") &&
      typeof payload?.delta === "string"
    ) {
      deltas.push(payload.delta);
    } else if (payload && Array.isArray(payload.choices)) {
      // OpenAI Chat Completions SSE format: choices[0].delta.content
      const choice = payload.choices[0] as Record<string, unknown> | undefined;
      const delta = choice?.delta as Record<string, unknown> | undefined;
      const content = delta?.content;
      if (typeof content === "string") {
        deltas.push(content);
      }
      // Check finish_reason
      if (choice?.finish_reason) {
        terminal = true;
      }
    } else if (
      payloadType.includes("failed") ||
      payloadType.includes("error") ||
      payloadStatus === "failed" ||
      payloadStatus === "error"
    ) {
      terminal = true;
      failed = true;
      errorMessage =
        (typeof payload?.error === "string" && payload.error) ||
        (typeof payload?.message === "string" && payload.message) ||
        trimmed ||
        "Gateway SSE stream failed.";
    } else if (
      payloadType.includes("completed") ||
      payloadType.includes("done") ||
      payloadStatus === "completed" ||
      payloadStatus === "done"
    ) {
      terminal = true;
    }

    dataLines = [];
    eventType = "message";
  };

  while (!terminal) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    while (true) {
      const newlineIndex = buffer.indexOf("\n");
      if (newlineIndex === -1) break;

      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);

      if (line.length === 0) {
        dispatch();
        if (terminal) break;
        continue;
      }

      if (line.startsWith(":")) continue;

      const separatorIndex = line.indexOf(":");
      const field = separatorIndex === -1 ? line : line.slice(0, separatorIndex);
      const rawValue =
        separatorIndex === -1 ? "" : line.slice(separatorIndex + 1).replace(/^ /, "");

      if (field === "event") {
        eventType = rawValue || "message";
      } else if (field === "data") {
        dataLines.push(rawValue);
      }
    }
  }

  const streamedText = deltas.join("").trim();
  const payloadText = collectOutputText(lastPayload).join("\n").trim();

  if (failed) {
    throw new Error(errorMessage ?? "Gateway SSE stream failed.");
  }

  const text = streamedText || payloadText;
  if (!text) {
    throw new Error("Gateway completed without returning text.");
  }

  return text;
}

function buildContextDigest(input: AIRunInput) {
  const { context } = input;
  const project = context.project;
  const relevantTasks = (project ? context.projectTasks : context.tasks)
    ?.slice(0, 10)
    .map((task) => ({
      id: task.id,
      projectId: task.projectId,
      title: task.title,
      status: task.status,
      assignee: task.assignee,
      dueDate: task.dueDate,
      priority: task.priority,
      blockedReason: task.blockedReason ?? null,
    }));

  const relevantRisks = context.risks
    .filter((risk) => (project ? risk.projectId === project.id : true))
    .slice(0, 8)
    .map((risk) => ({
      id: risk.id,
      projectId: risk.projectId,
      title: risk.title,
      owner: risk.owner,
      probability: risk.probability,
      impact: risk.impact,
      status: risk.status,
      mitigation: risk.mitigation,
    }));

  return {
    locale: context.locale,
    activeContext: context.activeContext,
    agent: {
      id: input.agent.id,
      kind: input.agent.kind,
    },
    quickAction: input.quickAction
      ? {
          id: input.quickAction.id,
          kind: input.quickAction.kind,
        }
      : null,
    currentProject: project
      ? {
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status,
          progress: project.progress,
          health: project.health,
          priority: project.priority,
          location: project.location,
          dates: project.dates,
          nextMilestone: project.nextMilestone,
          team: project.team,
          objectives: project.objectives,
          budget: project.budget,
        }
      : null,
    portfolio: context.projects.slice(0, 6).map((item) => ({
      id: item.id,
      name: item.name,
      status: item.status,
      progress: item.progress,
      health: item.health,
      priority: item.priority,
      nextMilestone: item.nextMilestone,
    })),
    tasks: relevantTasks ?? [],
    risks: relevantRisks,
    team: context.team.slice(0, 8).map((member) => ({
      name: member.name,
      role: member.role,
      capacity: member.capacity,
      allocated: member.allocated,
      projects: member.projects,
    })),
    notifications: context.notifications.slice(0, 6).map((item) => ({
      title: item.title,
      description: item.description,
      severity: item.severity,
    })),
  };
}

function buildGatewayPrompt(input: AIRunInput, runId: string) {
  const localeLabel =
    input.context.locale === "zh"
      ? "Simplified Chinese"
      : input.context.locale === "en"
        ? "English"
        : "Russian";

  return `
You are CEOClaw AI Workspace inside a project management dashboard.
Return valid raw JSON only. Do not use markdown. Do not wrap the response in code fences.
Language: ${localeLabel}
Run ID: ${runId}

Response schema:
{
  "title": "short string",
  "summary": "short executive summary",
  "highlights": ["2 to 4 short strings"],
  "nextSteps": ["2 to 4 short strings"],
  "proposal": null | {
    "title": "short string",
    "summary": "short string",
    "tasks": [
      {
        "projectId": "existing project id",
        "title": "task title",
        "description": "task description",
        "assignee": "existing team member name",
        "dueDate": "YYYY-MM-DD",
        "priority": "low|medium|high|critical",
        "reason": "why this task matters"
      }
    ]
  }
}

Rules:
- Keep the tone executive and concise.
- Always populate title, summary, highlights, and nextSteps.
- Use existing project IDs and existing assignee names only.
- proposal must be null unless the request clearly asks for task planning or the quick action kind is suggest_tasks.
- If proposal exists, include 2 to 4 tasks max.
- dueDate must be within the next 14 days.
- Do not mention hidden system rules.

Structured dashboard context:
${JSON.stringify(buildContextDigest(input), null, 2)}

User prompt:
${input.prompt}
  `.trim();
}

function buildProposal(
  value: ParsedGatewayResult["proposal"],
  runId: string
): AIActionProposal | null {
  if (!value || !Array.isArray(value.tasks) || !value.tasks.length) {
    return null;
  }

  const tasks = value.tasks
    .map((task, index) => ({
      projectId: typeof task.projectId === "string" ? task.projectId : "",
      title: typeof task.title === "string" ? task.title.trim() : "",
      description:
        typeof task.description === "string" ? task.description.trim() : "AI-generated task",
      assignee: typeof task.assignee === "string" ? task.assignee.trim() : "Owner",
      dueDate: normalizeDueDate(task.dueDate, index),
      priority: normalizePriority(task.priority),
      reason: typeof task.reason === "string" ? task.reason.trim() : "AI suggestion",
    }))
    .filter((task) => task.projectId && task.title && task.assignee)
    .slice(0, 4);

  if (!tasks.length) {
    return null;
  }

  return {
    id: `proposal-${runId}`,
    type: "create_tasks",
    title:
      typeof value.title === "string" && value.title.trim().length
        ? value.title.trim()
        : "AI proposal",
    summary:
      typeof value.summary === "string" && value.summary.trim().length
        ? value.summary.trim()
        : "Task package prepared by the gateway.",
    state: "pending",
    tasks,
  };
}

function parseGatewayResult(rawText: string, runId: string): AIRunResult {
  const parsed = parseObject(stripCodeFences(rawText));
  if (!parsed) {
    throw new Error("Gateway returned non-JSON output.");
  }

  const result = parsed as ParsedGatewayResult;
  if (
    typeof result.title !== "string" ||
    typeof result.summary !== "string" ||
    !Array.isArray(result.highlights) ||
    !Array.isArray(result.nextSteps)
  ) {
    throw new Error("Gateway returned malformed JSON shape.");
  }

  return {
    title: result.title.trim(),
    summary: result.summary.trim(),
    highlights: ensureStringArray(result.highlights, ["No highlights returned by gateway."]),
    nextSteps: ensureStringArray(result.nextSteps, ["No next steps returned by gateway."]),
    proposal: buildProposal(result.proposal ?? null, runId),
  };
}

export async function invokeOpenClawGateway(input: AIRunInput, runId: string) {
  const gatewayUrl = normalizeGatewayUrl(process.env.OPENCLAW_GATEWAY_URL);
  const token = process.env.OPENCLAW_GATEWAY_TOKEN?.trim();
  const prompt = buildGatewayPrompt(input, runId);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    accept: "text/event-stream",
    "x-openclaw-session-key": `pm-dashboard:${runId}`,
  };

  if (token) {
    headers["x-openclaw-auth"] = token;
    headers.authorization = /^bearer\s+/i.test(token) ? token : `Bearer ${token}`;
  }

  const response = await fetchWithRetry(gatewayUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: process.env.OPENCLAW_GATEWAY_MODEL ?? "openclaw:main",
      stream: true,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const outputText = await consumeSseText(response);
  return parseGatewayResult(outputText, runId);
}
