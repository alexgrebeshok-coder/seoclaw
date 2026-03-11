export type EvidenceVerificationStatus = "reported" | "observed" | "verified";

export interface EvidenceMetadata {
  [key: string]: string | number | boolean | null;
}

export interface EvidenceRecordView {
  id: string;
  sourceType: string;
  sourceRef: string | null;
  entityType: string;
  entityRef: string;
  projectId: string | null;
  title: string;
  summary: string | null;
  observedAt: string;
  reportedAt: string | null;
  confidence: number;
  verificationStatus: EvidenceVerificationStatus;
  metadata: EvidenceMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceSummary {
  total: number;
  reported: number;
  observed: number;
  verified: number;
  averageConfidence: number | null;
  lastObservedAt: string | null;
}

export interface EvidenceListResult {
  syncedAt: string;
  summary: EvidenceSummary;
  records: EvidenceRecordView[];
}

export interface EvidenceQuery {
  entityRef?: string;
  entityType?: string;
  limit?: number;
  projectId?: string;
  verificationStatus?: EvidenceVerificationStatus;
}

export interface EvidenceUpsertInput {
  sourceType: string;
  sourceRef?: string | null;
  entityType: string;
  entityRef: string;
  projectId?: string | null;
  title: string;
  summary?: string | null;
  observedAt: string;
  reportedAt?: string | null;
  confidence: number;
  verificationStatus: EvidenceVerificationStatus;
  metadata?: EvidenceMetadata;
}

export interface EvidenceFusionSourceView {
  recordId: string;
  sourceType: string;
  entityType: string;
  entityRef: string;
  title: string;
  confidence: number;
  verificationStatus: EvidenceVerificationStatus;
  observedAt: string;
  matchReasons: string[];
}

export interface EvidenceFusionFactView {
  id: string;
  projectId: string | null;
  projectName: string | null;
  title: string;
  reportId: string;
  reportNumber: string | null;
  reportDate: string | null;
  section: string | null;
  observedAt: string;
  confidence: number;
  verificationStatus: EvidenceVerificationStatus;
  explanation: string;
  sourceCount: number;
  sources: EvidenceFusionSourceView[];
}

export interface EvidenceFusionSummary {
  total: number;
  reported: number;
  observed: number;
  verified: number;
  averageConfidence: number | null;
  strongestFactTitle: string | null;
}

export interface EvidenceFusionOverview {
  syncedAt: string;
  summary: EvidenceFusionSummary;
  facts: EvidenceFusionFactView[];
}

export interface EvidenceFusionQuery {
  limit?: number;
  projectId?: string;
  verificationStatus?: EvidenceVerificationStatus;
}
