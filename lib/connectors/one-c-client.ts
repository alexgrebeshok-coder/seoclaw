type OneCFetch = typeof fetch;

type OneCProbeMetadata = Record<string, string | number | boolean | null>;
type OneCSampleMetadata = Record<string, string | number | boolean | null>;

export interface OneCProjectFinanceSample {
  source: "one-c";
  projectId: string | null;
  projectName: string | null;
  status: string;
  currency: string | null;
  reportDate: string | null;
  plannedBudget: number | null;
  actualBudget: number | null;
  paymentsActual: number | null;
  actsActual: number | null;
  variance: number | null;
  variancePercent: number | null;
}

export interface OneCFinanceSampleSnapshot {
  id: "one-c";
  checkedAt: string;
  configured: boolean;
  status: "ok" | "pending" | "degraded";
  message: string;
  missingSecrets: string[];
  sampleUrl?: string;
  samples: OneCProjectFinanceSample[];
  metadata?: OneCSampleMetadata;
}

export function getOneCApiUrl(env: NodeJS.ProcessEnv = process.env) {
  return env.ONE_C_BASE_URL?.trim() || null;
}

export function getOneCApiKey(env: NodeJS.ProcessEnv = process.env) {
  return env.ONE_C_API_KEY?.trim() || null;
}

export function buildOneCSampleUrl(baseUrl: string, pageSize = 3) {
  const url = new URL(baseUrl);
  const normalizedPath = url.pathname.replace(/\/$/, "");

  if (!url.search) {
    if (hasExplicitSamplePath(normalizedPath)) {
      url.pathname = normalizedPath;
    } else if (normalizedPath.endsWith("/health") || normalizedPath.endsWith("/status")) {
      url.pathname = normalizedPath.replace(/\/(health|status)$/i, "/project-financials");
    } else {
      url.pathname = `${normalizedPath}/project-financials`;
    }
  }

  if (!url.searchParams.has("page_size")) {
    url.searchParams.set("page_size", String(pageSize));
  }

  return url.toString();
}

export function buildOneCProbeUrl(baseUrl: string) {
  return buildOneCSampleUrl(baseUrl, 1);
}

export async function probeOneCApi(
  input: {
    baseUrl: string;
    apiKey: string;
  },
  fetchImpl: OneCFetch = fetch
): Promise<
  | {
      ok: true;
      probeUrl: string;
      remoteStatus: "ok" | "degraded";
      message: string;
      metadata: OneCProbeMetadata;
    }
  | {
      ok: false;
      probeUrl: string;
      message: string;
      status?: number;
      metadata?: OneCProbeMetadata;
    }
> {
  const probeUrl = buildOneCProbeUrl(input.baseUrl);
  const response = await fetchImpl(probeUrl, {
    method: "GET",
    headers: buildOneCHeaders(input.apiKey),
    cache: "no-store",
  });

  const text = await response.text();
  const parsedPayload = parseJson(text);

  if (!response.ok) {
    return {
      ok: false,
      probeUrl,
      status: response.status,
      message: `HTTP ${response.status} while calling 1C read probe`,
      metadata: {
        probeUrl,
        responseShape: describePayloadShape(parsedPayload),
      },
    };
  }

  if (parsedPayload === undefined || parsedPayload === null) {
    return {
      ok: false,
      probeUrl,
      message:
        parsedPayload === null
          ? "1C read probe returned an empty payload."
          : "1C read probe returned a non-JSON payload.",
      metadata: {
        probeUrl,
        contentLength: text.length,
      },
    };
  }

  const samples = normalizeOneCFinanceSamples(parsedPayload);

  if (samples.length === 0) {
    return {
      ok: false,
      probeUrl,
      message: "1C read probe returned JSON, but no project finance records were found.",
      metadata: {
        probeUrl,
        responseShape: describePayloadShape(parsedPayload),
      },
    };
  }

  const provider = readStringField(parsedPayload, ["provider", "system", "source", "vendor", "platform"]);
  const remoteStatus = inferOneCRemoteStatus(parsedPayload);
  const totals = summarizeFinanceSamples(samples);
  const pathname = new URL(probeUrl).pathname;

  return {
    ok: true,
    probeUrl,
    remoteStatus,
    message:
      remoteStatus === "ok"
        ? `1C read probe returned ${samples.length} project finance record${samples.length === 1 ? "" : "s"} from ${pathname}.`
        : `1C read probe returned finance data from ${pathname}, but the remote payload reported degraded health.`,
    metadata: {
      probeUrl,
      responseShape: describePayloadShape(parsedPayload),
      remoteStatus,
      projectCount: samples.length,
      totalPlannedBudget: totals.totalPlannedBudget,
      totalActualBudget: totals.totalActualBudget,
      totalPaymentsActual: totals.totalPaymentsActual,
      ...(provider ? { provider } : {}),
    },
  };
}

export async function fetchOneCFinanceSample(
  input: {
    baseUrl: string;
    apiKey: string;
  },
  fetchImpl: OneCFetch = fetch
): Promise<
  | {
      ok: true;
      sampleUrl: string;
      message: string;
      samples: OneCProjectFinanceSample[];
      metadata: OneCSampleMetadata;
    }
  | {
      ok: false;
      sampleUrl: string;
      message: string;
      status?: number;
      metadata?: OneCSampleMetadata;
    }
> {
  const sampleUrl = buildOneCSampleUrl(input.baseUrl);
  const response = await fetchImpl(sampleUrl, {
    method: "GET",
    headers: buildOneCHeaders(input.apiKey),
    cache: "no-store",
  });

  const text = await response.text();
  const parsedPayload = parseJson(text);

  if (!response.ok) {
    return {
      ok: false,
      sampleUrl,
      status: response.status,
      message: `HTTP ${response.status} while calling 1C finance sample`,
      metadata: {
        sampleUrl,
        responseShape: describePayloadShape(parsedPayload),
      },
    };
  }

  if (parsedPayload === undefined || parsedPayload === null) {
    return {
      ok: false,
      sampleUrl,
      message:
        parsedPayload === null
          ? "1C finance sample returned an empty payload."
          : "1C finance sample returned a non-JSON payload.",
      metadata: {
        sampleUrl,
        contentLength: text.length,
      },
    };
  }

  const samples = normalizeOneCFinanceSamples(parsedPayload);

  if (samples.length === 0) {
    return {
      ok: false,
      sampleUrl,
      message: "1C finance sample returned JSON, but no project finance records were found.",
      metadata: {
        sampleUrl,
        responseShape: describePayloadShape(parsedPayload),
      },
    };
  }

  const provider = readStringField(parsedPayload, ["provider", "system", "source", "vendor", "platform"]);
  const totals = summarizeFinanceSamples(samples);

  return {
    ok: true,
    sampleUrl,
    message: `1C finance sample returned ${samples.length} project record${samples.length === 1 ? "" : "s"} from ${new URL(sampleUrl).pathname}.`,
    samples,
    metadata: {
      sampleUrl,
      responseShape: describePayloadShape(parsedPayload),
      sampleCount: samples.length,
      totalPlannedBudget: totals.totalPlannedBudget,
      totalActualBudget: totals.totalActualBudget,
      totalPaymentsActual: totals.totalPaymentsActual,
      ...(provider ? { provider } : {}),
    },
  };
}

export async function getOneCFinanceSampleSnapshot(
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: OneCFetch = fetch
): Promise<OneCFinanceSampleSnapshot> {
  const checkedAt = new Date().toISOString();
  const apiUrl = getOneCApiUrl(env);
  const apiKey = getOneCApiKey(env);
  const missingSecrets = [
    ...(apiUrl ? [] : ["ONE_C_BASE_URL"]),
    ...(apiKey ? [] : ["ONE_C_API_KEY"]),
  ];

  if (missingSecrets.length > 0) {
    return {
      id: "one-c",
      checkedAt,
      configured: false,
      status: "pending",
      message: "1C finance sample is waiting for ONE_C_BASE_URL and ONE_C_API_KEY.",
      missingSecrets,
      samples: [],
    };
  }

  try {
    const result = await fetchOneCFinanceSample(
      {
        baseUrl: apiUrl!,
        apiKey: apiKey!,
      },
      fetchImpl
    );

    if (!result.ok) {
      return {
        id: "one-c",
        checkedAt,
        configured: true,
        status: "degraded",
        message: `1C finance sample failed: ${result.message}`,
        missingSecrets: [],
        sampleUrl: result.sampleUrl,
        samples: [],
        metadata: result.metadata,
      };
    }

    return {
      id: "one-c",
      checkedAt,
      configured: true,
      status: "ok",
      message: result.message,
      missingSecrets: [],
      sampleUrl: result.sampleUrl,
      samples: result.samples,
      metadata: result.metadata,
    };
  } catch (error) {
    return {
      id: "one-c",
      checkedAt,
      configured: true,
      status: "degraded",
      message:
        error instanceof Error
          ? `1C finance sample failed: ${error.message}`
          : "1C finance sample failed with an unknown error.",
      missingSecrets: [],
      samples: [],
    };
  }
}

function buildOneCHeaders(apiKey: string) {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${apiKey}`,
    "X-API-Key": apiKey,
  };
}

function hasExplicitSamplePath(pathname: string) {
  return /\/(project-financials|financial-status|financials|budget-status|odata\/projectfinancials)$/i.test(
    pathname
  );
}

function inferOneCRemoteStatus(payload: unknown): "ok" | "degraded" {
  const rawStatus = readStringField(payload, ["status", "health"]);

  if (!rawStatus) {
    return "ok";
  }

  const normalized = rawStatus.trim().toLowerCase();
  return normalized.includes("degrad") || normalized.includes("error") || normalized.includes("fail")
    ? "degraded"
    : "ok";
}

function normalizeOneCFinanceSamples(payload: unknown): OneCProjectFinanceSample[] {
  const records = collectFinanceRecords(payload);
  const samples: OneCProjectFinanceSample[] = [];

  for (const record of records) {
    const sample = normalizeFinanceRecord(record);

    if (sample) {
      samples.push(sample);
    }
  }

  return samples;
}

function collectFinanceRecords(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;

  for (const key of ["projects", "items", "rows", "records", "results", "value", "data"]) {
    const nested = record[key];

    if (Array.isArray(nested)) {
      return nested;
    }

    if (nested && typeof nested === "object") {
      const nestedRecords = collectFinanceRecords(nested);
      if (nestedRecords.length > 0) {
        return nestedRecords;
      }
    }
  }

  return looksLikeFinanceRecord(record) ? [record] : [];
}

function looksLikeFinanceRecord(record: Record<string, unknown>) {
  const projectId = readStringField(record, ["project_id", "projectId", "id", "project_code", "projectCode"]);
  const projectName = readStringField(record, ["project_name", "projectName", "name", "title"]);
  const plannedBudget = readNumberField(record, ["planned_budget", "plannedBudget", "budget_plan", "budgetPlan"]);
  const actualBudget = readNumberField(record, ["actual_budget", "actualBudget", "budget_actual", "budgetActual", "budget_fact", "budgetFact"]);
  const paymentsActual = readNumberField(record, ["payments_actual", "paymentsActual", "paid_amount", "paidAmount", "payment_fact", "paymentFact"]);

  return Boolean(projectId || projectName || plannedBudget !== null || actualBudget !== null || paymentsActual !== null);
}

function normalizeFinanceRecord(record: unknown): OneCProjectFinanceSample | null {
  if (!record || typeof record !== "object") {
    return null;
  }

  const value = record as Record<string, unknown>;
  const projectId = readStringField(value, ["project_id", "projectId", "id", "project_code", "projectCode", "ref"]);
  const projectName = readStringField(value, ["project_name", "projectName", "name", "title"]);
  const plannedBudget = readNumberField(value, ["planned_budget", "plannedBudget", "budget_plan", "budgetPlan", "bac"]);
  const actualBudget = readNumberField(value, ["actual_budget", "actualBudget", "budget_actual", "budgetActual", "budget_fact", "budgetFact", "ac"]);
  const paymentsActual = readNumberField(value, ["payments_actual", "paymentsActual", "paid_amount", "paidAmount", "payment_fact", "paymentFact"]);
  const actsActual = readNumberField(value, ["acts_actual", "actsActual", "accepted_amount", "acceptedAmount", "closed_acts", "closedActs"]);
  const explicitVariance = readNumberField(value, ["variance", "budget_variance", "budgetVariance", "vac"]);
  const variance =
    explicitVariance !== null
      ? explicitVariance
      : plannedBudget !== null && actualBudget !== null
        ? plannedBudget - actualBudget
        : null;
  const explicitVariancePercent = readNumberField(value, ["variance_percent", "variancePercent", "budget_variance_ratio", "budgetVarianceRatio"]);
  const variancePercent =
    explicitVariancePercent !== null
      ? explicitVariancePercent
      : variance !== null && plannedBudget !== null && plannedBudget !== 0
        ? variance / plannedBudget
        : null;

  if (
    projectId === null &&
    projectName === null &&
    plannedBudget === null &&
    actualBudget === null &&
    paymentsActual === null &&
    actsActual === null
  ) {
    return null;
  }

  return {
    source: "one-c",
    projectId,
    projectName,
    status: normalizeStatus(
      readStringField(value, ["status", "project_status", "projectStatus", "state"]) ??
        deriveFinanceStatus(variancePercent, actualBudget, paymentsActual)
    ),
    currency: readStringField(value, ["currency", "currency_code", "currencyCode"]),
    reportDate: readStringField(value, ["report_date", "reportDate", "as_of", "asOf", "date", "period"]),
    plannedBudget,
    actualBudget,
    paymentsActual,
    actsActual,
    variance,
    variancePercent,
  };
}

function deriveFinanceStatus(
  variancePercent: number | null,
  actualBudget: number | null,
  paymentsActual: number | null
) {
  if (variancePercent !== null && variancePercent < -0.05) {
    return "over_budget";
  }

  if ((actualBudget ?? 0) > 0 || (paymentsActual ?? 0) > 0) {
    return "in_progress";
  }

  return "reported";
}

function normalizeStatus(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized.replace(/\s+/g, "_");
}

function summarizeFinanceSamples(samples: OneCProjectFinanceSample[]) {
  return samples.reduce(
    (accumulator, sample) => {
      accumulator.totalPlannedBudget += sample.plannedBudget ?? 0;
      accumulator.totalActualBudget += sample.actualBudget ?? 0;
      accumulator.totalPaymentsActual += sample.paymentsActual ?? 0;
      return accumulator;
    },
    {
      totalPlannedBudget: 0,
      totalActualBudget: 0,
      totalPaymentsActual: 0,
    }
  );
}

function readStringField(record: unknown, keys: string[]) {
  if (!record || typeof record !== "object") {
    return null;
  }

  const value = record as Record<string, unknown>;

  for (const key of keys) {
    const fieldValue = value[key];
    if (typeof fieldValue === "string" && fieldValue.trim()) {
      return fieldValue.trim();
    }
  }

  return null;
}

function readNumberField(record: unknown, keys: string[]) {
  if (!record || typeof record !== "object") {
    return null;
  }

  const value = record as Record<string, unknown>;

  for (const key of keys) {
    const fieldValue = value[key];

    if (typeof fieldValue === "number" && Number.isFinite(fieldValue)) {
      return fieldValue;
    }

    if (typeof fieldValue === "string" && fieldValue.trim()) {
      const parsed = Number(fieldValue);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function describePayloadShape(payload: unknown) {
  if (Array.isArray(payload)) {
    return `array(${payload.length})`;
  }

  if (payload === null) {
    return "null";
  }

  if (payload === undefined) {
    return "non-json";
  }

  if (typeof payload === "object") {
    return `object(${Object.keys(payload as Record<string, unknown>).join(",")})`;
  }

  return typeof payload;
}

function parseJson(text: string): unknown {
  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
