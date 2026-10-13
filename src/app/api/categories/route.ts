import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import {
  ForbiddenError,
  UnauthorizedError,
  requireOrganizationMembership,
} from "@/lib/auth/organization";
import { createCategory, getCategories } from "@/lib/services/category.service";
import {
  createCategorySchema,
  getCategoriesSchema,
} from "@/lib/validations/category.validation";

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

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    const parsed = getCategoriesSchema.safeParse(query);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid query parameters",
          errors: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const organization = await requireOrganizationMembership();

    const result = await getCategories({
      organizationId: organization.organizationId,
      ...parsed.data,
    });

    return NextResponse.json({
      success: true,
      categories: result.categories,
      pagination: result.pagination,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    console.error("GET /api/categories error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json().catch(() => null);
    const parsed = createCategorySchema.safeParse(body);

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

    const organization = await requireOrganizationMembership("admin");

    const category = await createCategory({
      organizationId: organization.organizationId,
      ...parsed.data,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Category created successfully",
        category,
      },
      { status: 201 },
    );
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

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

    if (error instanceof Error && error.message === "Invalid organization ID") {
      return NextResponse.json(
        { success: false, message: "Invalid organization" },
        { status: 400 },
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

    console.error("POST /api/categories error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to create category" },
      { status: 500 },
    );
  }
}
