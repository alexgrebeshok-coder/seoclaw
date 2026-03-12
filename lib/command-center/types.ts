import type { DerivedSyncCheckpointView } from "@/lib/sync-state";

export type ExceptionInboxLayer = "escalation" | "reconciliation";
export type ExceptionInboxStatus = "open" | "acknowledged" | "resolved";
export type ExceptionInboxUrgency = "critical" | "high" | "medium" | "low";

export interface ExceptionInboxOwnerView {
  id: string | null;
  mode: "assigned" | "suggested" | "unassigned";
  name: string;
  role: string | null;
}

export interface ExceptionInboxLinkView {
  href: string;
  label: string;
}

export interface ExceptionInboxItem {
  id: string;
  sourceId: string;
  layer: ExceptionInboxLayer;
  title: string;
  summary: string | null;
  projectId: string | null;
  projectName: string | null;
  urgency: ExceptionInboxUrgency;
  status: ExceptionInboxStatus;
  owner: ExceptionInboxOwnerView;
  sourceLabel: string;
  sourceState: string;
  nextAction: string;
  observedAt: string;
  links: ExceptionInboxLinkView[];
}

export interface ExceptionInboxSummary {
  total: number;
  open: number;
  acknowledged: number;
  resolved: number;
  critical: number;
  high: number;
  assigned: number;
  unassigned: number;
  escalations: number;
  reconciliation: number;
}

export interface ExceptionInboxSyncSummary {
  escalations: DerivedSyncCheckpointView | null;
  reconciliation: DerivedSyncCheckpointView | null;
}

export interface ExceptionInboxResult {
  syncedAt: string | null;
  summary: ExceptionInboxSummary;
  items: ExceptionInboxItem[];
  sync: ExceptionInboxSyncSummary;
}

export interface ExceptionInboxQuery {
  includeResolved?: boolean;
  limit?: number;
}
