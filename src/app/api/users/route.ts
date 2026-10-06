import {
  ForbiddenError,
  UnauthorizedError,
  requireOrganizationMembership,
} from "@/lib/auth/organization";
import { connectDB } from "@/lib/db/mongoose";
import { createUser, getUsers } from "@/lib/services/user.service";
import { createUserSchema } from "@/lib/validations/user.validation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const organization = await requireOrganizationMembership(
      "6ac0c5cc8e734b2c3c24d600",
      "viewer",
    );

    await connectDB();

    const { searchParams } = new URL(request.url);

    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 20);
    const statusParam = searchParams.get("status");
    const search = searchParams.get("search") ?? undefined;
    const roleParam = searchParams.get("role");

    const validRoles = ["owner", "admin", "member", "viewer"] as const;
    const validStatuses = ["active", "invited", "suspended"] as const;

    if (
      roleParam &&
      !validRoles.includes(roleParam as (typeof validRoles)[number])
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid role",
        },
        { status: 400 },
      );
    }

    if (
      statusParam &&
      !validStatuses.includes(statusParam as (typeof validStatuses)[number])
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid status",
        },
        { status: 400 },
      );
    }

    const role = roleParam
      ? (roleParam as (typeof validRoles)[number])
      : undefined;

    const status = statusParam
      ? (statusParam as (typeof validStatuses)[number])
      : undefined;

    const result = await getUsers(organization.organizationId, {
      page,
      limit,
      status,
      search,
      role,
    });

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
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const user = await createUser(organization.organizationId, parsed.data);

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
