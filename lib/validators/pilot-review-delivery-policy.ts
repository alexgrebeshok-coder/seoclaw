import { z } from "zod";

import { isSupportedPilotReviewDeliveryTimeZone } from "@/lib/pilot-review/delivery-policies";

const timezoneSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => isSupportedPilotReviewDeliveryTimeZone(value), {
    message: "timezone must be a valid IANA timezone.",
  });

const weekdaySchema = z.number().int().min(0).max(6);
const hourSchema = z.number().int().min(0).max(23);

export const pilotReviewDeliveryPolicyCreateSchema = z.object({
  active: z.boolean().optional(),
  deliveryHour: hourSchema,
  deliveryWeekday: weekdaySchema,
  recipient: z.string().trim().email().optional().nullable(),
  timezone: timezoneSchema,
});

export const pilotReviewDeliveryPolicyUpdateSchema = z
  .object({
    active: z.boolean().optional(),
    deliveryHour: hourSchema.optional(),
    deliveryWeekday: weekdaySchema.optional(),
    recipient: z.string().trim().email().optional().nullable(),
    timezone: timezoneSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided.",
  });

export const pilotReviewDeliveryRunSchema = z.object({
  dryRun: z.boolean().optional(),
});
