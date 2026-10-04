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
