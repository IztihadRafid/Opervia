import { z } from "zod";
import Application from "../db/models/Application";

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
  page: z.coerce.number().int().min(1).default(1),
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
    website: z.string().trim().pipe(z.url()).optional(),
    status: z.enum(["active", "inactive", "archived"]).optional(),
    owner: z.string().trim().max(150).optional(),
    usersCount: z.number().int().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update",
  });
export async function deleteApplication(
  organizationId: string,
  applicationId: string,
) {
  const application = await Application.findOneAndDelete({
    _id: applicationId,
    organizationId,
  });

  if (!application) {
    return null;
  }

  return {
    _id: application._id.toString(),
  };
}
