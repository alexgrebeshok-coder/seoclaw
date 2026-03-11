export {
  getEvidenceLedgerOverview,
  getEvidenceRecordById,
  mapGpsSnapshotToEvidenceInputs,
  mapWorkReportToEvidenceInput,
  summarizeEvidenceRecords,
} from "@/lib/evidence/service";
export { getEvidenceFusionOverview, buildEvidenceFusionFacts } from "@/lib/evidence/fusion";
export type {
  EvidenceFusionFactView,
  EvidenceFusionOverview,
  EvidenceFusionQuery,
  EvidenceFusionSourceView,
  EvidenceFusionSummary,
  EvidenceListResult,
  EvidenceMetadata,
  EvidenceQuery,
  EvidenceRecordView,
  EvidenceSummary,
  EvidenceUpsertInput,
  EvidenceVerificationStatus,
} from "@/lib/evidence/types";
