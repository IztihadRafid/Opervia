import { Types } from "mongoose";
import Category, {
  type CategoryStatus,
  type ICategory,
} from "@/lib/db/models/Category";

interface GetCategoriesParams {
  organizationId: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: CategoryStatus;
}

interface CreateCategoryParams {
  organizationId: string;
  name: string;
}

interface UpdateCategoryParams {
  organizationId: string;
  categoryId: string;
  name?: string;
  status?: CategoryStatus;
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validateObjectId(value: string, fieldName: string): void {
  if (!Types.ObjectId.isValid(value)) {
    throw new Error(`Invalid ${fieldName}`);
  }
}

function serializeCategory(category: ICategory) {
  return {
    id: category._id.toString(),
    name: category.name,
    status: category.status,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

export async function getCategories({
  organizationId,
  page = 1,
  limit = 25,
  search,
  status,
}: GetCategoriesParams) {
  validateObjectId(organizationId, "organization ID");

  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));

  const filter: {
    organizationId: Types.ObjectId;
    status?: CategoryStatus;
    normalizedName?: { $regex: RegExp };
  } = {
    organizationId: new Types.ObjectId(organizationId),
  };

  if (status) {
    filter.status = status;
  }

  const normalizedSearch = search?.trim();

  if (normalizedSearch) {
    filter.normalizedName = {
      $regex: new RegExp(escapeRegex(normalizeName(normalizedSearch))),
    };
  }

  const [categories, total] = await Promise.all([
    Category.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit),
    Category.countDocuments(filter),
  ]);

  return {
    categories: categories.map(serializeCategory),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

export async function createCategory({
  organizationId,
  name,
}: CreateCategoryParams) {
  validateObjectId(organizationId, "organization ID");

  const trimmedName = name.trim();

  if (trimmedName.length < 2 || trimmedName.length > 100) {
    throw new Error("Category name must be between 2 and 100 characters");
  }

  const normalizedName = normalizeName(trimmedName);
  const organizationObjectId = new Types.ObjectId(organizationId);

  const existingCategory = await Category.findOne({
    organizationId: organizationObjectId,
    normalizedName,
  }).select("_id");

  if (existingCategory) {
    throw new Error("A category with this name already exists");
  }

  try {
    const category = await Category.create({
      organizationId: organizationObjectId,
      name: trimmedName,
      normalizedName,
      status: "active",
    });

    return serializeCategory(category);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new Error("A category with this name already exists");
    }

    throw error;
  }
}

export async function updateCategory({
  organizationId,
  categoryId,
  name,
  status,
}: UpdateCategoryParams) {
  validateObjectId(organizationId, "organization ID");
  validateObjectId(categoryId, "category ID");

  if (name === undefined && status === undefined) {
    throw new Error("At least one field is required for update");
  }

  const organizationObjectId = new Types.ObjectId(organizationId);

  const category = await Category.findOne({
    _id: new Types.ObjectId(categoryId),
    organizationId: organizationObjectId,
  });

  if (!category) {
    throw new Error("Category not found");
  }

  if (name !== undefined) {
    const trimmedName = name.trim();

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      throw new Error("Category name must be between 2 and 100 characters");
    }

    const normalizedName = normalizeName(trimmedName);

    const duplicateCategory = await Category.findOne({
      organizationId: organizationObjectId,
      normalizedName,
      _id: { $ne: category._id },
    }).select("_id");

    if (duplicateCategory) {
      throw new Error("A category with this name already exists");
    }

    category.name = trimmedName;
    category.normalizedName = normalizedName;
  }

  if (status !== undefined) {
    category.status = status;
  }

  try {
    await category.save();
    return serializeCategory(category);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new Error("A category with this name already exists");
    }

    throw error;
  }
}

export async function deactivateCategory(
  organizationId: string,
  categoryId: string,
) {
  return updateCategory({
    organizationId,
    categoryId,
    status: "inactive",
  });
}
