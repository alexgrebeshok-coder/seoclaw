import type { EvidenceVerificationStatus } from "@/lib/evidence";

export type VideoFactObservationType =
  | "progress_visible"
  | "blocked_area"
  | "idle_equipment"
  | "safety_issue";

export interface CreateVideoFactInput {
  reportId: string;
  title?: string;
  summary?: string;
  url: string;
  capturedAt: string;
  mimeType?: string | null;
  size?: number | null;
  observationType: VideoFactObservationType;
}

export interface VideoFactView {
  id: string;
  documentId: string;
  reportId: string;
  reportNumber: string | null;
  reportStatus: string | null;
  projectId: string | null;
  projectName: string | null;
  section: string | null;
  title: string;
  summary: string | null;
  url: string | null;
  mimeType: string | null;
  size: number | null;
  observationType: VideoFactObservationType;
  capturedAt: string;
  reportedAt: string | null;
  confidence: number;
  verificationStatus: Extract<EvidenceVerificationStatus, "observed" | "verified">;
  verificationRule: string | null;
}

export interface VideoFactSummary {
  total: number;
  observed: number;
  verified: number;
  averageConfidence: number | null;
  lastCapturedAt: string | null;
}

export interface VideoFactListResult {
  syncedAt: string;
  summary: VideoFactSummary;
  items: VideoFactView[];
}

export interface VideoFactQuery {
  limit?: number;
  projectId?: string;
}
