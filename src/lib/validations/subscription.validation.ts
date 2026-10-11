import { z } from "zod";

const billingCycleSchema = z.enum(["monthly", "quarterly", "yearly"]);

const subscriptionStatusSchema = z.enum([
  "active",
  "cancelled",
  "expired",
  "paused",
]);

const currencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(3)
  .regex(/^[A-Z]{3}$/, "Currency must be a three-letter code");

const dateSchema = z.iso
  .datetime({ offset: true })
  .transform((value) => new Date(value));

const subscriptionFields = {
  applicationId: z.string().regex(/^[a-f\d]{24}$/i, {
    message: "Invalid application ID",
  }),
  plan: z.string().trim().min(1).max(150),
  billingCycle: billingCycleSchema,
  amount: z.number().finite().min(0),
  currency: currencySchema.default("USD"),
  renewalDate: dateSchema,
  status: subscriptionStatusSchema.default("active"),
  startDate: dateSchema,
  endDate: dateSchema.optional(),
};

function validateDateOrder(
  data: {
    startDate?: Date;
    endDate?: Date | null;
    renewalDate?: Date;
  },
  ctx: z.RefinementCtx,
) {
  if (data.startDate && data.endDate && data.endDate < data.startDate) {
    ctx.addIssue({
      code: "custom",
      path: ["endDate"],
      message: "End date cannot be before the start date",
    });
  }
}

export const createSubscriptionSchema = z
  .object(subscriptionFields)
  .superRefine(validateDateOrder);

export const updateSubscriptionSchema = z
  .object({
    applicationId: subscriptionFields.applicationId.optional(),
    plan: subscriptionFields.plan.optional(),
    billingCycle: billingCycleSchema.optional(),
    amount: subscriptionFields.amount.optional(),
    currency: currencySchema.optional(),
    renewalDate: dateSchema.optional(),
    status: subscriptionStatusSchema.optional(),
    startDate: dateSchema.optional(),
    endDate: dateSchema.nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update",
  })
  .superRefine(validateDateOrder);

export const getSubscriptionsSchema = z.object({
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  status: subscriptionStatusSchema.optional(),
  billingCycle: billingCycleSchema.optional(),
  search: z.string().trim().max(100).optional(),
});
