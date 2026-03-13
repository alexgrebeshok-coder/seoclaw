import { z } from "zod";

export const telegramBriefDeliverySchema = z
  .object({
    scope: z.enum(["portfolio", "project"]),
    projectId: z.string().trim().min(1).optional(),
    locale: z.enum(["ru", "en"]).optional(),
    chatId: z.string().trim().min(1).optional(),
    idempotencyKey: z.string().trim().min(1).optional(),
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
