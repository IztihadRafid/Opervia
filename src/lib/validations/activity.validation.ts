import { z } from "zod";

export const activityTypes = [
  "application_added",
  "application_updated",
  "application_deleted",
  "subscription_renewed",
  "user_invited",
  "invitation_revoked",
  "payment_processed",
] as const;

export const getActivitiesSchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(25),

  type: z.enum(activityTypes).optional(),
});

export type GetActivitiesQuery = z.infer<typeof getActivitiesSchema>;
