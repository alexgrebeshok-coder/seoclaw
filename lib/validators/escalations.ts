import { z } from "zod";

export const escalationQueueStatusSchema = z.enum(["open", "acknowledged", "resolved"]);

export const escalationUpdateSchema = z
  .object({
    ownerId: z.string().trim().min(1).nullable().optional(),
    queueStatus: escalationQueueStatusSchema.optional(),
  })
  .strict();
