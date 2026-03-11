import { z } from "zod";

const isoDateSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: "Invalid date",
});

const optionalTrimmedString = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal("").transform(() => undefined));

export const videoFactObservationTypeSchema = z.enum([
  "progress_visible",
  "blocked_area",
  "idle_equipment",
  "safety_issue",
]);

export const createVideoFactSchema = z.object({
  reportId: z.string().trim().min(1),
  title: optionalTrimmedString(255),
  summary: optionalTrimmedString(2000),
  url: z.string().trim().url().max(2000),
  capturedAt: isoDateSchema,
  mimeType: optionalTrimmedString(255),
  size: z.union([z.coerce.number().int().min(0), z.null()]).optional(),
  observationType: videoFactObservationTypeSchema,
});
