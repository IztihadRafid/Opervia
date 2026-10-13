import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import {
  ForbiddenError,
  UnauthorizedError,
  requireOrganizationMembership,
} from "@/lib/auth/organization";
import Category from "@/lib/db/models/Category";
import { updateCategory } from "@/lib/services/category.service";
import { updateCategorySchema } from "@/lib/validations/category.validation";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function handleAuthError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 401 },
    );
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 403 },
    );
  }

  return null;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await connectDB();

    const organization = await requireOrganizationMembership();
    const { id } = await context.params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid category ID" },
        { status: 400 },
      );
    }

    const category = await Category.findOne({
      _id: id,
      organizationId: organization.organizationId,
    }).lean();

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      category: {
        id: String(category._id),
        name: category.name,
        status: category.status,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
    });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    console.error("GET /api/categories/[id] error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch category" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await connectDB();

    const organization = await requireOrganizationMembership("admin");
    const { id } = await context.params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid category ID" },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = updateCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid category data",
          errors: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const category = await updateCategory({
      organizationId: organization.organizationId,
      categoryId: id,
      ...parsed.data,
    });

    return NextResponse.json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    if (error instanceof Error && error.message === "Category not found") {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 },
      );
    }

    if (
      error instanceof Error &&
      error.message === "A category with this name already exists"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A category with this name already exists in your organization",
        },
        { status: 409 },
      );
    }

    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid category data",
          error: error.message,
        },
        { status: 400 },
      );
    }

    console.error("PATCH /api/categories/[id] error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update category" },
      { status: 500 },
    );
  }
}
