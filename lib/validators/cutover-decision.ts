import { z } from "zod";

export const createCutoverDecisionSchema = z.object({
  decisionType: z.enum(["cutover_approved", "warning_waiver", "rollback"]),
  details: z.string().trim().max(4000).optional().nullable(),
  summary: z.string().trim().min(1).max(300),
  warningId: z.string().trim().max(200).optional().nullable(),
  warningLabel: z.string().trim().max(300).optional().nullable(),
});
