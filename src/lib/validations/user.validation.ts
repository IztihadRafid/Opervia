import { z } from "zod";

export const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),

  email: z
    .email("Invalid email address")
    .trim()
    .toLowerCase()
    .max(254, "Email must not exceed 254 characters"),
  role: z.enum(["owner", "admin", "member", "viewer"]).default("member"),
  status: z.enum(["active", "invited", "suspended"]).default("active"),
});

export const updateUserSchema = createUserSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update",
  });

const positiveIntegerQuery = z
  .string()
  .regex(/^\d+$/, "Must be a positive integer")
  .transform(Number)
  .pipe(
    z
      .number()
      .int()
      .min(1, "Must be at least 1")
      .max(100_000, "Page must not exceed 100000"),
  );

export const getUsersQuerySchema = z.object({
  page: positiveIntegerQuery.optional().default(1),

  limit: positiveIntegerQuery
    .pipe(z.number().max(100, "Limit must not exceed 100"))
    .optional()
    .default(20),

  status: z.enum(["active", "invited", "suspended"]).optional(),

  role: z.enum(["owner", "admin", "member", "viewer"]).optional(),

  search: z
    .string()
    .trim()
    .max(100, "Search must not exceed 100 characters")
    .optional()
    .transform((value) => value || undefined),
});
