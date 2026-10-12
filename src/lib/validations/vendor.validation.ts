import { z } from "zod";

const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .transform((value) => (value === "" ? undefined : value));

const optionalEmail = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().trim().email().max(254).optional(),
);

const optionalWebsite = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z
    .string()
    .trim()
    .max(500)
    .url()
    .refine(
      (value) => {
        try {
          const protocol = new URL(value).protocol;
          return protocol === "http:" || protocol === "https:";
        } catch {
          return false;
        }
      },
      { message: "Website must use HTTP or HTTPS" },
    )
    .optional(),
);

export const vendorStatusSchema = z.enum(["active", "inactive"]);

export const getVendorsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(150).default(""),
  status: vendorStatusSchema.optional(),
});

export const createVendorSchema = z.object({
  name: z.string().trim().min(2).max(150),
  website: optionalWebsite,
  contactName: optionalText(150),
  contactEmail: optionalEmail,
  phone: optionalText(50),
  notes: optionalText(2000),
  status: vendorStatusSchema.default("active"),
});

export const updateVendorSchema = z
  .object({
    name: z.string().trim().min(2).max(150).optional(),
    website: optionalWebsite,
    contactName: optionalText(150),
    contactEmail: optionalEmail,
    phone: optionalText(50),
    notes: optionalText(2000),
    status: vendorStatusSchema.optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field must be provided",
  });

export type GetVendorsQuery = z.infer<typeof getVendorsSchema>;
export type CreateVendorInput = z.infer<typeof createVendorSchema>;
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;
