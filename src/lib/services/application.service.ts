import {
  ApplicationListItem,
  ApplicationPagination,
} from "../../../types/application";
import Application from "../db/models/Application";
import Vendor from "@/lib/db/models/Vendor";
import mongoose from "mongoose";
import Category from "@/lib/db/models/Category";
interface GetApplicationsOptions {
  page?: number;
  limit?: number;
  status?: "active" | "inactive" | "archived";
  search?: string;
}

type ApplicationData = {
  name: string;
  vendorId: string;
  category: string;
  description?: string;
  website?: string;
  status?: "active" | "inactive" | "archived";
  owner?: string;
  usersCount?: number;
};

type ApplicationUpdateData = {
  name?: string;
  vendorId?: string;
  category?: string;
  description?: string;
  website?: string;
  status?: "active" | "inactive" | "archived";
  owner?: string;
  usersCount?: number;
};

export class InvalidApplicationVendorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidApplicationVendorError";
  }
}
export class InvalidApplicationCategoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidApplicationCategoryError";
  }
}
async function getActiveVendor(organizationId: string, vendorId: string) {
  if (!mongoose.isValidObjectId(vendorId)) {
    throw new InvalidApplicationVendorError("The selected vendor is invalid.");
  }

  const vendor = await Vendor.findOne({
    _id: vendorId,
    organizationId,
    status: "active",
  }).lean();

  if (!vendor) {
    throw new InvalidApplicationVendorError(
      "The selected vendor does not exist, is inactive, or does not belong to this organization.",
    );
  }

  return vendor;
}
async function getActiveCategory(organizationId: string, categoryName: string) {
  const normalizedName = categoryName.trim().toLowerCase().replace(/\s+/g, " ");

  const category = await Category.findOne({
    organizationId,
    normalizedName,
    status: "active",
  }).lean();

  if (!category) {
    throw new InvalidApplicationCategoryError(
      "The selected category does not exist, is inactive, or does not belong to this organization.",
    );
  }

  return category;
}
function serializeApplication(
  application: {
    _id: mongoose.Types.ObjectId;
    organizationId: mongoose.Types.ObjectId;
    vendorId?: mongoose.Types.ObjectId;
    name: string;
    vendor: string;
    category: string;
    description?: string;
    website?: string;
    status: "active" | "inactive" | "archived";
    owner?: string;
    usersCount: number;
    createdAt: Date;
    updatedAt: Date;
  },
  canonicalVendorName?: string,
) {
  return {
    _id: application._id.toString(),
    organizationId: application.organizationId.toString(),
    vendorId: application.vendorId?.toString(),
    name: application.name,
    vendor: canonicalVendorName ?? application.vendor,
    category: application.category,
    description: application.description,
    website: application.website,
    status: application.status,
    owner: application.owner,
    usersCount: application.usersCount,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
  };
}

export async function getApplications(
  organizationId: string,
  options: GetApplicationsOptions = {},
): Promise<{
  applications: ApplicationListItem[];
  pagination: ApplicationPagination;
}> {
  const page = Math.max(options.page ?? 1, 1);
  const limit = Math.min(Math.max(options.limit ?? 25, 1), 100);
  const skip = (page - 1) * limit;

  const filter: {
    organizationId: string;
    status?: "active" | "inactive" | "archived";
    $or?: {
      name?: { $regex: string; $options: string };
      vendor?: { $regex: string; $options: string };
    }[];
  } = { organizationId };

  if (options.status) {
    filter.status = options.status;
  }

  if (options.search) {
    const escapedSearch = options.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    filter.$or = [
      { name: { $regex: escapedSearch, $options: "i" } },
      { vendor: { $regex: escapedSearch, $options: "i" } },
    ];
  }

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Application.countDocuments(filter),
  ]);

  const vendorIds = applications
    .map((application) => application.vendorId)
    .filter((id): id is mongoose.Types.ObjectId => Boolean(id));

  const vendors = vendorIds.length
    ? await Vendor.find({
        _id: { $in: vendorIds },
        organizationId,
      })
        .select("_id name")
        .lean()
    : [];

  const vendorNames = new Map(
    vendors.map((vendor) => [vendor._id.toString(), vendor.name]),
  );

  const formattedApplications = applications.map((application) =>
    serializeApplication(
      application,
      application.vendorId
        ? vendorNames.get(application.vendorId.toString())
        : undefined,
    ),
  );

  return {
    applications: formattedApplications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getApplicationCount(organizationId: string) {
  return Application.countDocuments({ organizationId });
}

export async function createApplication(
  organizationId: string,
  data: ApplicationData,
) {
  const [vendor, category] = await Promise.all([
    getActiveVendor(organizationId, data.vendorId),
    getActiveCategory(organizationId, data.category),
  ]);

  const application = await Application.create({
    ...data,
    organizationId,
    vendorId: vendor._id,
    vendor: vendor.name,
    category: category.name,
  });

  return serializeApplication(application, vendor.name);
}

export async function updateApplication(
  organizationId: string,
  applicationId: string,
  data: ApplicationUpdateData,
) {
  const updateData: Record<string, unknown> = { ...data };

  delete updateData.vendorId;

  let canonicalVendorName: string | undefined;

  if (data.category !== undefined) {
    const category = await getActiveCategory(organizationId, data.category);

    updateData.category = category.name;
  }

  if (data.vendorId !== undefined) {
    const vendor = await getActiveVendor(organizationId, data.vendorId);

    updateData.vendorId = vendor._id;
    updateData.vendor = vendor.name;
    canonicalVendorName = vendor.name;
  }

  const application = await Application.findOneAndUpdate(
    {
      _id: applicationId,
      organizationId,
    },
    updateData,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!application) {
    return null;
  }

  if (!canonicalVendorName && application.vendorId) {
    const vendor = await Vendor.findOne({
      _id: application.vendorId,
      organizationId,
    })
      .select("name")
      .lean();

    canonicalVendorName = vendor?.name;
  }

  return serializeApplication(application, canonicalVendorName);
}

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

  return { _id: application._id.toString() };
}
