import { z } from "zod";

const licenseTypes = [
  "named_user",
  "concurrent",
  "site",
  "device",
  "subscription",
  "perpetual",
] as const;

const licenseStatuses = [
  "active",
  "expired",
  "suspended",
  "cancelled",
] as const;

export const createLicenseSchema = z
  .object({
    applicationId: z
      .string()
      .trim()
      .regex(/^[a-f\d]{24}$/i, "Invalid application ID."),

    name: z
      .string()
      .trim()
      .min(2, "License name must be at least 2 characters.")
      .max(150, "License name cannot exceed 150 characters."),

    licenseType: z.enum(licenseTypes),

    totalSeats: z
      .number()
      .int("Total seats must be a whole number.")
      .min(1, "Total seats must be at least 1."),

    usedSeats: z
      .number()
      .int("Used seats must be a whole number.")
      .min(0, "Used seats cannot be negative.")
      .default(0),

    status: z.enum(licenseStatuses).default("active"),

    startDate: z.coerce.date(),

    expiryDate: z.coerce.date().optional(),

    notes: z
      .string()
      .trim()
      .max(1000, "Notes cannot exceed 1000 characters.")
      .optional(),
  })
  .refine((data) => data.usedSeats <= data.totalSeats, {
    message: "Used seats cannot exceed total seats.",
    path: ["usedSeats"],
  })
  .refine((data) => !data.expiryDate || data.expiryDate >= data.startDate, {
    message: "Expiry date cannot be before the start date.",
    path: ["expiryDate"],
  });

export const updateLicenseSchema = z
  .object({
    applicationId: z
      .string()
      .trim()
      .regex(/^[a-f\d]{24}$/i, "Invalid application ID.")
      .optional(),

    name: z
      .string()
      .trim()
      .min(2, "License name must be at least 2 characters.")
      .max(150, "License name cannot exceed 150 characters.")
      .optional(),

    licenseType: z.enum(licenseTypes).optional(),

    totalSeats: z
      .number()
      .int("Total seats must be a whole number.")
      .min(1, "Total seats must be at least 1.")
      .optional(),

    usedSeats: z
      .number()
      .int("Used seats must be a whole number.")
      .min(0, "Used seats cannot be negative.")
      .optional(),

    status: z.enum(licenseStatuses).optional(),

    startDate: z.coerce.date().optional(),

    expiryDate: z.coerce.date().nullable().optional(),

    notes: z
      .string()
      .trim()
      .max(1000, "Notes cannot exceed 1000 characters.")
      .nullable()
      .optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field must be provided for an update.",
  });

export type CreateLicenseInput = z.infer<typeof createLicenseSchema>;

export type UpdateLicenseInput = z.infer<typeof updateLicenseSchema>;
