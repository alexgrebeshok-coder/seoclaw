import {
  getEscalationQueueOverview,
  syncEscalationQueue,
  type EscalationListResult,
  type EscalationRecordView,
} from "@/lib/escalations";
import {
  getReconciliationCasefiles,
  syncReconciliationCasefiles,
  type ReconciliationCasefileListResult,
  type ReconciliationCasefileView,
} from "@/lib/enterprise-truth";

import type {
  ExceptionInboxItem,
  ExceptionInboxOwnerView,
  ExceptionInboxQuery,
  ExceptionInboxResult,
  ExceptionInboxStatus,
  ExceptionInboxSummary,
  ExceptionInboxUrgency,
} from "./types";

interface ExceptionInboxDeps {
  escalations?: EscalationListResult;
  getEscalations?: (query: {
    includeResolved?: boolean;
    limit?: number;
  }) => Promise<EscalationListResult>;
  getReconciliation?: (query: {
    limit?: number;
    resolutionStatus?: "open" | "resolved";
  }) => Promise<ReconciliationCasefileListResult>;
  reconciliation?: ReconciliationCasefileListResult;
  syncEscalations?: () => Promise<void>;
  syncReconciliation?: () => Promise<void>;
}

export async function getExecutiveExceptionInbox(
  query: ExceptionInboxQuery = {},
  deps: ExceptionInboxDeps = {}
): Promise<ExceptionInboxResult> {
  const limit = sanitizeLimit(query.limit, 24, 48);
  const getEscalations =
    deps.getEscalations ??
    ((input: { includeResolved?: boolean; limit?: number }) =>
      getEscalationQueueOverview(input));
  const getReconciliation =
    deps.getReconciliation ??
    ((input: { limit?: number; resolutionStatus?: "open" | "resolved" }) =>
      getReconciliationCasefiles(input));

  const [escalations, reconciliation] = await Promise.all([
    deps.escalations ??
      getEscalations({
        includeResolved: query.includeResolved,
        limit,
      }),
    deps.reconciliation ??
      getReconciliation({
        limit,
        ...(query.includeResolved ? {} : { resolutionStatus: "open" }),
      }),
  ]);

  const items = [
    ...escalations.items.map(mapEscalationInboxItem),
    ...reconciliation.cases.map(mapReconciliationInboxItem),
  ]
    .filter((item) => query.includeResolved || item.status !== "resolved")
    .sort(compareInboxItems)
    .slice(0, limit);

  return {
    syncedAt: maxTimestamp([escalations.syncedAt, reconciliation.syncedAt]),
    summary: summarizeInboxItems(items),
    items,
    sync: {
      escalations: escalations.sync,
      reconciliation: reconciliation.sync,
    },
  };
}

export async function syncExecutiveExceptionInbox(
  query: ExceptionInboxQuery = {},
  deps: ExceptionInboxDeps = {}
): Promise<ExceptionInboxResult> {
  const syncEscalations = deps.syncEscalations ?? (() => syncEscalationQueue());
  const syncReconciliation = deps.syncReconciliation ?? (() => syncReconciliationCasefiles());

  await Promise.all([syncEscalations(), syncReconciliation()]);

  return getExecutiveExceptionInbox(query, deps);
}

function mapEscalationInboxItem(item: EscalationRecordView): ExceptionInboxItem {
  return {
    id: `escalation:${item.id}`,
    sourceId: item.id,
    layer: "escalation",
    title: item.title,
    summary: item.summary,
    projectId: item.projectId,
    projectName: item.projectName,
    urgency: item.urgency,
    status: normalizeEscalationStatus(item.queueStatus),
    owner: item.owner
      ? {
          id: item.owner.id,
          mode: "assigned",
          name: item.owner.name,
          role: item.owner.role,
        }
      : item.recommendedOwnerRole
        ? {
            id: null,
            mode: "suggested",
            name: `${formatRoleLabel(item.recommendedOwnerRole)} follow-through`,
            role: item.recommendedOwnerRole,
          }
        : {
            id: null,
            mode: "unassigned",
            name: "Unassigned",
            role: null,
          },
    sourceLabel: "Escalation queue",
    sourceState: item.sourceStatus,
    nextAction: buildEscalationNextAction(item),
    observedAt: item.lastObservedAt,
    links: compactLinks([
      { href: "/work-reports", label: "Open work reports" },
      item.projectId
        ? { href: `/projects/${item.projectId}`, label: "Open project" }
        : null,
    ]),
  };
}

function mapReconciliationInboxItem(item: ReconciliationCasefileView): ExceptionInboxItem {
  return {
    id: `reconciliation:${item.id}`,
    sourceId: item.id,
    layer: "reconciliation",
    title: item.title,
    summary: item.explanation,
    projectId: item.projectId,
    projectName: item.projectName,
    urgency: deriveReconciliationUrgency(item),
    status: item.resolutionStatus === "resolved" ? "resolved" : "open",
    owner: deriveReconciliationOwner(item),
    sourceLabel: "Reconciliation casefile",
    sourceState: item.truthStatus,
    nextAction: buildReconciliationNextAction(item),
    observedAt: item.lastObservedAt,
    links: compactLinks([
      { href: "/integrations", label: "Open connector health" },
      item.evidenceRecordIds.length > 0 || item.fusionFactIds.length > 0
        ? { href: "/work-reports", label: "Open work reports" }
        : null,
      item.projectId
        ? { href: `/projects/${item.projectId}`, label: "Open project" }
        : null,
    ]),
  };
}

function summarizeInboxItems(items: ExceptionInboxItem[]): ExceptionInboxSummary {
  return {
    total: items.length,
    open: items.filter((item) => item.status === "open").length,
    acknowledged: items.filter((item) => item.status === "acknowledged").length,
    resolved: items.filter((item) => item.status === "resolved").length,
    critical: items.filter((item) => item.urgency === "critical").length,
    high: items.filter((item) => item.urgency === "high").length,
    assigned: items.filter((item) => item.owner.mode === "assigned").length,
    unassigned: items.filter((item) => item.owner.mode === "unassigned").length,
    escalations: items.filter((item) => item.layer === "escalation").length,
    reconciliation: items.filter((item) => item.layer === "reconciliation").length,
  };
}

function buildEscalationNextAction(item: EscalationRecordView) {
  if (!item.owner) {
    return "Assign an owner and acknowledge the item before it drifts past SLA.";
  }

  if (item.queueStatus === "open" && item.sourceStatus === "needs_approval") {
    return "Review the blocked proposal, decide on approval, and acknowledge the handoff.";
  }

  if (item.queueStatus === "open" && item.sourceStatus === "failed") {
    return "Inspect the failed run, decide on rerun or compensation, and acknowledge the owner handoff.";
  }

  if (item.queueStatus === "acknowledged") {
    return "Drive remediation to closure, then resolve the item from the inbox.";
  }

  return "Review the source workflow and decide whether the item should stay open.";
}

function deriveReconciliationUrgency(
  item: ReconciliationCasefileView
): ExceptionInboxUrgency {
  if (item.truthStatus === "contradictory" && item.reasonCodes.includes("finance_over_plan")) {
    return "critical";
  }

  if (item.truthStatus === "contradictory") {
    return "high";
  }

  if (item.caseType === "telemetry_gap") {
    return "medium";
  }

  if (
    item.reasonCodes.includes("finance_missing") ||
    item.reasonCodes.includes("field_missing") ||
    item.reasonCodes.includes("telemetry_unmatched")
  ) {
    return "medium";
  }

  return "low";
}

function deriveReconciliationOwner(
  item: ReconciliationCasefileView
): ExceptionInboxOwnerView {
  if (item.truthStatus === "contradictory") {
    return {
      id: null,
      mode: "suggested",
      name: "PM follow-through",
      role: "PM",
    };
  }

  if (item.caseType === "telemetry_gap" || item.reasonCodes.includes("telemetry_unmatched")) {
    return {
      id: null,
      mode: "suggested",
      name: "OPS follow-through",
      role: "OPS",
    };
  }

  if (item.reasonCodes.includes("finance_missing") || item.finance?.budgetDeltaStatus === "over_plan") {
    return {
      id: null,
      mode: "suggested",
      name: "Finance review",
      role: "FINANCE",
    };
  }

  return {
    id: null,
    mode: "suggested",
    name: "PM follow-through",
    role: "PM",
  };
}

function buildReconciliationNextAction(item: ReconciliationCasefileView) {
  if (item.truthStatus === "contradictory") {
    return "Coordinate field, telemetry, and finance owners, correct the mismatch at the source, then rerun reconciliation sync.";
  }

  if (item.caseType === "telemetry_gap") {
    return "Inspect the GPS/geofence activity, confirm whether a work report or project mapping is missing, then rerun reconciliation sync.";
  }

  if (item.reasonCodes.includes("finance_missing") && item.reasonCodes.includes("field_present")) {
    return "Validate the 1C project mapping or wait for the next finance read window, then rerun reconciliation sync.";
  }

  if (item.reasonCodes.includes("field_missing") && item.reasonCodes.includes("finance_present")) {
    return "Check whether field evidence or video facts are missing for this project before the next sync.";
  }

  return "Open the linked source, reconcile the missing fact, and rerun sync to clear the case.";
}

function compareInboxItems(left: ExceptionInboxItem, right: ExceptionInboxItem) {
  const statusDiff = getStatusRank(left.status) - getStatusRank(right.status);
  if (statusDiff !== 0) {
    return statusDiff;
  }

  const urgencyDiff = getUrgencyRank(left.urgency) - getUrgencyRank(right.urgency);
  if (urgencyDiff !== 0) {
    return urgencyDiff;
  }

  const layerDiff = getLayerRank(left.layer) - getLayerRank(right.layer);
  if (layerDiff !== 0) {
    return layerDiff;
  }

  return Date.parse(right.observedAt) - Date.parse(left.observedAt);
}

function getStatusRank(status: ExceptionInboxStatus) {
  switch (status) {
    case "open":
      return 0;
    case "acknowledged":
      return 1;
    case "resolved":
    default:
      return 2;
  }
}

function getUrgencyRank(urgency: ExceptionInboxUrgency) {
  switch (urgency) {
    case "critical":
      return 0;
    case "high":
      return 1;
    case "medium":
      return 2;
    case "low":
    default:
      return 3;
  }
}

function getLayerRank(layer: ExceptionInboxItem["layer"]) {
  return layer === "escalation" ? 0 : 1;
}

function normalizeEscalationStatus(
  status: EscalationRecordView["queueStatus"]
): ExceptionInboxStatus {
  switch (status) {
    case "acknowledged":
      return "acknowledged";
    case "resolved":
      return "resolved";
    case "open":
    default:
      return "open";
  }
}

function formatRoleLabel(value: string) {
  switch (value.toUpperCase()) {
    case "EXEC":
      return "Executive";
    case "FINANCE":
      return "Finance";
    case "OPS":
      return "Ops";
    case "PM":
    default:
      return "PM";
  }
}

function compactLinks(items: Array<{ href: string; label: string } | null>) {
  return items.filter((item): item is { href: string; label: string } => Boolean(item));
}

function maxTimestamp(values: Array<string | null>) {
  const timestamps = values.filter((value): value is string => Boolean(value));
  if (timestamps.length === 0) {
    return null;
  }

  return timestamps.sort((left, right) => Date.parse(right) - Date.parse(left))[0] ?? null;
}

function sanitizeLimit(value: number | undefined, fallback: number, max: number) {
  if (!Number.isFinite(value) || value === undefined) {
    return fallback;
  }

  return Math.min(Math.max(Math.trunc(value), 1), max);
}
