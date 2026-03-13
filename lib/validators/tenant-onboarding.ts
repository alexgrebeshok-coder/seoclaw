import { z } from "zod";

const optionalString = z.string().trim().max(4000).nullable().optional();
const optionalTenantSlug = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9-]*$/i, "Target tenant slug must be alphanumeric and may include dashes.")
  .nullable()
  .optional();

export const tenantOnboardingStatusSchema = z.enum([
  "draft",
  "prepared",
  "scheduled",
  "completed",
]);

export const createTenantOnboardingRunbookSchema = z.object({
  handoffNotes: optionalString,
  operatorNotes: optionalString,
  rollbackPlan: optionalString,
  rolloutScope: z.string().trim().min(1).max(4000),
  status: tenantOnboardingStatusSchema.optional(),
  summary: z.string().trim().min(1).max(240),
  targetCutoverAt: z.string().datetime().nullable().optional(),
  targetTenantLabel: z.string().trim().min(1).max(120).nullable().optional(),
  targetTenantSlug: optionalTenantSlug,
});

export const updateTenantOnboardingRunbookSchema = createTenantOnboardingRunbookSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided.",
  });
