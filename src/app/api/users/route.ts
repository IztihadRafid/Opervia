import {
  ForbiddenError,
  UnauthorizedError,
  requireOrganizationMembership,
} from "@/lib/auth/organization";
import { connectDB } from "@/lib/db/mongoose";
import { createUser, getUsers } from "@/lib/services/user.service";
import {
  createUserSchema,
  getUsersQuerySchema,
} from "@/lib/validations/user.validation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const organization = await requireOrganizationMembership(
      "6ac0c5cc8e734b2c3c24d600",
      "viewer",
    );

    await connectDB();

    const { searchParams } = new URL(request.url);

    const parsedQuery = getUsersQuerySchema.safeParse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      role: searchParams.get("role") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    });

    if (!parsedQuery.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid query parameters",
          errors: parsedQuery.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const result = await getUsers(
      organization.organizationId,
      parsedQuery.data,
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 401 },
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 403 },
      );
    }

    console.error("Users GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load users",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const organization = await requireOrganizationMembership(
      "6ac0c5cc8e734b2c3c24d600",
      "admin",
    );

    await connectDB();

    const body = await request.json();

    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: parsed.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    if (
      organization.role !== "owner" &&
      (parsed.data.role === "owner" || parsed.data.role === "admin")
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Only owners can create admin or owner users",
        },
        { status: 403 },
      );
    }

    const user = await createUser(organization.organizationId, {
      ...parsed.data,
      status: "invited",
    });

    return NextResponse.json(
      {
        success: true,
        data: user,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 401 },
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 403 },
      );
    }

    if (
      error instanceof Error &&
      error.message === "A user with this email already exists"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 409 },
      );
    }

    console.error("Users POST error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create user",
      },
      { status: 500 },
    );
  }
}
