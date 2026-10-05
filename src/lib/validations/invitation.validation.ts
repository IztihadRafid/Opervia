import { z } from "zod";

export const createInvitationSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .check(z.email("Invalid email address"))
    .max(254),

  role: z.enum(["admin", "member", "viewer"]),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
