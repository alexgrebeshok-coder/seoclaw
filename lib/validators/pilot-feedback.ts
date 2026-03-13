import { z } from "zod";

export const pilotFeedbackTargetTypeSchema = z.enum([
  "exception_item",
  "reconciliation_casefile",
  "workflow_run",
]);

export const pilotFeedbackStatusSchema = z.enum(["open", "in_review", "resolved"]);

export const pilotFeedbackSeveritySchema = z.enum(["critical", "high", "medium", "low"]);

export const pilotFeedbackCreateSchema = z.object({
  targetType: pilotFeedbackTargetTypeSchema,
  targetId: z.string().trim().min(1).max(160),
  targetLabel: z.string().trim().min(1).max(240),
  sourceLabel: z.string().trim().min(1).max(160).optional().nullable(),
  sourceHref: z.string().trim().max(300).optional().nullable(),
  projectId: z.string().trim().max(120).optional().nullable(),
  projectName: z.string().trim().max(160).optional().nullable(),
  severity: pilotFeedbackSeveritySchema.optional(),
  summary: z.string().trim().min(1).max(280),
  details: z.string().trim().max(4000).optional().nullable(),
  ownerId: z.string().trim().max(120).optional().nullable(),
  reporterName: z.string().trim().max(120).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const pilotFeedbackUpdateSchema = z
  .object({
    status: pilotFeedbackStatusSchema.optional(),
    severity: pilotFeedbackSeveritySchema.optional(),
    summary: z.string().trim().min(1).max(280).optional(),
    details: z.string().trim().max(4000).optional().nullable(),
    ownerId: z.string().trim().max(120).optional().nullable(),
    resolutionNote: z.string().trim().max(2000).optional().nullable(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one update field is required.",
  });
