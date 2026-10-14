import {
  ForbiddenError,
  UnauthorizedError,
  requireOrganizationMembership,
} from "@/lib/auth/organization";
import { connectDB } from "@/lib/db/mongoose";
import { getUsers } from "@/lib/services/user.service";
import { getUsersQuerySchema } from "@/lib/validations/user.validation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const organization = await requireOrganizationMembership("viewer");

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

    console.error("Users GET error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load users" },
      { status: 500 },
    );
  }
}
