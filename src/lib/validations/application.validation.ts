import { z } from "zod";

export const createApplicationSchema = z.object({
  name: z.string().trim().min(2).max(150),
  vendor: z.string().trim().min(2).max(150),
  category: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1000).optional(),
  website: z.url().max(500).optional(),
  status: z.enum(["active", "inactive", "archived"]).optional(),
  owner: z.string().trim().max(150).optional(),
  usersCount: z.number().int().min(0).optional(),
});
export const getApplicationsSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .max(100_000, "Page must not exceed 100000")
    .default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  status: z.enum(["active", "inactive", "archived"]).optional(),
  search: z.string().trim().max(100).optional(),
});
export const updateApplicationSchema = z
  .object({
    name: z.string().trim().min(2).max(150).optional(),
    vendor: z.string().trim().min(2).max(150).optional(),
    category: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().max(1000).optional(),
    website: z.string().trim().max(500).pipe(z.url()).optional(),
    status: z.enum(["active", "inactive", "archived"]).optional(),
    owner: z.string().trim().max(150).optional(),
    usersCount: z.number().int().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update",
  });
