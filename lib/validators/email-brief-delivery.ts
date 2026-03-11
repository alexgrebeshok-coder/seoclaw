import { z } from "zod";

export const emailBriefDeliverySchema = z
  .object({
    scope: z.enum(["portfolio", "project"]),
    projectId: z.string().trim().min(1).optional(),
    locale: z.enum(["ru", "en"]).optional(),
    recipient: z.string().trim().email().optional(),
    dryRun: z.boolean().optional(),
  })
  .superRefine((value, context) => {
    if (value.scope === "project" && !value.projectId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "projectId is required for project scope.",
        path: ["projectId"],
      });
    }
  });
