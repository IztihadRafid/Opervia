import { Types } from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import License, { type ILicense } from "@/lib/db/models/License";
import Application from "@/lib/db/models/Application";
import {
  createLicenseSchema,
  updateLicenseSchema,
  type CreateLicenseInput,
  type UpdateLicenseInput,
} from "@/lib/validations/license.validation";

interface GetLicensesOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: "active" | "expired" | "suspended" | "cancelled";
  applicationId?: string;
}

function serializeLicense(license: ILicense) {
  return {
    id: license._id.toString(),
    organizationId: license.organizationId.toString(),
    applicationId: license.applicationId.toString(),
    name: license.name,
    licenseType: license.licenseType,
    totalSeats: license.totalSeats,
    usedSeats: license.usedSeats,
    availableSeats: Math.max(0, license.totalSeats - license.usedSeats),
    status: license.status,
    startDate: license.startDate.toISOString(),
    expiryDate: license.expiryDate?.toISOString() ?? null,
    notes: license.notes ?? "",
    createdAt: license.createdAt.toISOString(),
    updatedAt: license.updatedAt.toISOString(),
  };
}

async function assertApplicationBelongsToOrganization(
  applicationId: string | Types.ObjectId,
  organizationId: Types.ObjectId,
) {
  if (!Types.ObjectId.isValid(applicationId)) {
    throw new Error("Invalid application ID.");
  }

  const application = await Application.findOne({
    _id: applicationId,
    organizationId,
  })
    .select("_id")
    .lean();

  if (!application) {
    throw new Error("Application not found in this organization.");
  }
}

export async function getLicenses(
  organizationId: string,
  options: GetLicensesOptions = {},
) {
  await connectDB();

  const page = Math.max(1, Math.floor(options.page ?? 1));
  const limit = Math.min(100, Math.max(1, Math.floor(options.limit ?? 25)));

  const filter: {
    organizationId: Types.ObjectId;
    status?: "active" | "expired" | "suspended" | "cancelled";
    applicationId?: Types.ObjectId;
    name?: {
      $regex: string;
      $options: string;
    };
  } = {
    organizationId: new Types.ObjectId(organizationId),
  };

  if (options.status) {
    filter.status = options.status;
  }

  if (options.applicationId) {
    if (!Types.ObjectId.isValid(options.applicationId)) {
      throw new Error("Invalid application ID.");
    }

    filter.applicationId = new Types.ObjectId(options.applicationId);
  }

  if (options.search?.trim()) {
    filter.name = {
      $regex: options.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      $options: "i",
    };
  }

  const [licenses, total] = await Promise.all([
    License.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    License.countDocuments(filter),
  ]);

  return {
    data: licenses.map((license) =>
      serializeLicense(license as unknown as ILicense),
    ),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getLicenseById(
  organizationId: string,
  licenseId: string,
) {
  await connectDB();

  if (!Types.ObjectId.isValid(licenseId)) {
    throw new Error("Invalid license ID.");
  }

  const license = await License.findOne({
    _id: licenseId,
    organizationId,
  }).lean();

  if (!license) {
    return null;
  }

  return serializeLicense(license as unknown as ILicense);
}

export async function createLicense(
  organizationId: string,
  input: CreateLicenseInput,
) {
  await connectDB();

  const parsed = createLicenseSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues.map((issue) => issue.message).join(" "),
    );
  }

  const orgId = new Types.ObjectId(organizationId);
  const data = parsed.data;

  await assertApplicationBelongsToOrganization(data.applicationId, orgId);

  const license = await License.create({
    ...data,
    organizationId: orgId,
    applicationId: new Types.ObjectId(data.applicationId),
  });

  return serializeLicense(license);
}

export async function updateLicense(
  organizationId: string,
  licenseId: string,
  input: UpdateLicenseInput,
) {
  await connectDB();

  if (!Types.ObjectId.isValid(licenseId)) {
    throw new Error("Invalid license ID.");
  }

  const parsed = updateLicenseSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues.map((issue) => issue.message).join(" "),
    );
  }

  const orgId = new Types.ObjectId(organizationId);

  const existing = await License.findOne({
    _id: licenseId,
    organizationId: orgId,
  });

  if (!existing) {
    return null;
  }

  const data = parsed.data;

  const nextApplicationId =
    data.applicationId ?? existing.applicationId.toString();

  await assertApplicationBelongsToOrganization(nextApplicationId, orgId);

  const nextTotalSeats = data.totalSeats ?? existing.totalSeats;
  const nextUsedSeats = data.usedSeats ?? existing.usedSeats;
  const nextStartDate = data.startDate ?? existing.startDate;
  const nextExpiryDate =
    data.expiryDate === undefined ? existing.expiryDate : data.expiryDate;

  if (nextUsedSeats > nextTotalSeats) {
    throw new Error("Used seats cannot exceed total seats.");
  }

  if (nextExpiryDate && nextExpiryDate < nextStartDate) {
    throw new Error("Expiry date cannot be before the start date.");
  }

  if (data.applicationId) {
    existing.applicationId = new Types.ObjectId(data.applicationId);
  }

  if (data.name !== undefined) existing.name = data.name;
  if (data.licenseType !== undefined) {
    existing.licenseType = data.licenseType;
  }
  if (data.totalSeats !== undefined) {
    existing.totalSeats = data.totalSeats;
  }
  if (data.usedSeats !== undefined) {
    existing.usedSeats = data.usedSeats;
  }
  if (data.status !== undefined) existing.status = data.status;
  if (data.startDate !== undefined) existing.startDate = data.startDate;

  if (data.expiryDate !== undefined) {
    existing.expiryDate = data.expiryDate ?? undefined;
  }

  if (data.notes !== undefined) {
    existing.notes = data.notes ?? undefined;
  }

  await existing.save();

  return serializeLicense(existing);
}

export async function deleteLicense(organizationId: string, licenseId: string) {
  await connectDB();

  if (!Types.ObjectId.isValid(licenseId)) {
    throw new Error("Invalid license ID.");
  }

  const deleted = await License.findOneAndDelete({
    _id: licenseId,
    organizationId,
  });

  return deleted !== null;
}
