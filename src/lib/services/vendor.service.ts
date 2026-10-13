import { Types } from "mongoose";
import Application from "@/lib/db/models/Application";
import Vendor, {
  type IVendor,
  type VendorStatus,
} from "@/lib/db/models/Vendor";

export interface GetVendorsOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: VendorStatus;
}

export interface VendorInput {
  name: string;
  website?: string;
  contactName?: string;
  contactEmail?: string;
  phone?: string;
  notes?: string;
  status?: VendorStatus;
}

export interface VendorListItem {
  _id: string;
  organizationId: string;
  name: string;
  website?: string;
  contactName?: string;
  contactEmail?: string;
  phone?: string;
  notes?: string;
  status: VendorStatus;
  applicationCount: number;
  createdAt: string;
  updatedAt: string;
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function serializeVendor(
  vendor: IVendor,
  applicationCount = 0,
): VendorListItem {
  return {
    _id: vendor._id.toString(),
    organizationId: vendor.organizationId.toString(),
    name: vendor.name,
    website: vendor.website,
    contactName: vendor.contactName,
    contactEmail: vendor.contactEmail,
    phone: vendor.phone,
    notes: vendor.notes,
    status: vendor.status,
    applicationCount,
    createdAt: vendor.createdAt.toISOString(),
    updatedAt: vendor.updatedAt.toISOString(),
  };
}

async function getApplicationCounts(organizationId: string) {
  const counts = await Application.aggregate<{
    _id: Types.ObjectId;
    count: number;
  }>([
    {
      $match: {
        organizationId: new Types.ObjectId(organizationId),
        vendorId: { $exists: true, $ne: null },
      },
    },
    {
      $group: {
        _id: "$vendorId",
        count: { $sum: 1 },
      },
    },
  ]);

  const result = new Map<string, number>();

  for (const item of counts) {
    result.set(item._id.toString(), item.count);
  }

  return result;
}

export async function getVendors(
  organizationId: string,
  options: GetVendorsOptions = {},
): Promise<{
  vendors: VendorListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const page = Math.max(1, Math.floor(options.page ?? 1));
  const limit = Math.min(100, Math.max(1, Math.floor(options.limit ?? 25)));

  const filter: Record<string, unknown> = {
    organizationId: new Types.ObjectId(organizationId),
  };

  if (options.status) {
    filter.status = options.status;
  }

  if (options.search?.trim()) {
    const search = escapeRegex(normalizeName(options.search));

    filter.normalizedName = {
      $regex: search,
      $options: "i",
    };
  }

  const [items, total, applicationCounts] = await Promise.all([
    Vendor.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),

    Vendor.countDocuments(filter),

    getApplicationCounts(organizationId),
  ]);

  return {
    vendors: items.map((vendor) =>
      serializeVendor(
        vendor,
        applicationCounts.get(vendor._id.toString()) ?? 0,
      ),
    ),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function createVendor(
  organizationId: string,
  data: VendorInput,
): Promise<VendorListItem> {
  const vendor = await Vendor.create({
    ...data,
    organizationId: new Types.ObjectId(organizationId),
    normalizedName: normalizeName(data.name),
  });

  return serializeVendor(vendor, 0);
}

export async function updateVendor(
  organizationId: string,
  vendorId: string,
  data: Partial<VendorInput>,
): Promise<VendorListItem | null> {
  if (!Types.ObjectId.isValid(vendorId)) {
    return null;
  }

  const updateData: Record<string, unknown> = {
    ...data,
  };

  if (data.name !== undefined) {
    updateData.normalizedName = normalizeName(data.name);
  }

  const vendor = await Vendor.findOneAndUpdate(
    {
      _id: new Types.ObjectId(vendorId),
      organizationId: new Types.ObjectId(organizationId),
    },
    updateData,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!vendor) {
    return null;
  }

  const applicationCounts = await getApplicationCounts(organizationId);

  return serializeVendor(
    vendor,
    applicationCounts.get(vendor._id.toString()) ?? 0,
  );
}

export async function deleteVendor(
  organizationId: string,
  vendorId: string,
): Promise<{
  deleted: boolean;
  linkedApplicationCount: number;
} | null> {
  if (!Types.ObjectId.isValid(vendorId)) {
    return null;
  }

  const organizationObjectId = new Types.ObjectId(organizationId);
  const vendorObjectId = new Types.ObjectId(vendorId);

  const vendor = await Vendor.findOne({
    _id: vendorObjectId,
    organizationId: organizationObjectId,
  });

  if (!vendor) {
    return null;
  }

  const linkedApplicationCount = await Application.countDocuments({
    organizationId: organizationObjectId,
    vendorId: vendorObjectId,
  });

  if (linkedApplicationCount > 0) {
    return {
      deleted: false,
      linkedApplicationCount,
    };
  }

  await Vendor.deleteOne({
    _id: vendorObjectId,
    organizationId: organizationObjectId,
  });

  return {
    deleted: true,
    linkedApplicationCount: 0,
  };
}
