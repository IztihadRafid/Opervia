import { NextResponse } from "next/server";

import {
  ForbiddenError,
  requireOrganizationMembership,
  UnauthorizedError,
} from "@/lib/auth/organization";
import { getActivities } from "@/lib/services/activity.service";
import { getActivitiesSchema } from "@/lib/validations/activity.validation";

import { connectDB } from "@/lib/db/mongoose";

const DEMO_ORGANIZATION_ID = "6ac0c5cc8e734b2c3c24d600";

export async function GET(request: Request) {
  try {
    await connectDB();

    const organization =
      await requireOrganizationMembership(DEMO_ORGANIZATION_ID);

    const url = new URL(request.url);

    const parsedQuery = getActivitiesSchema.safeParse({
      page: url.searchParams.get("page") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
      type: url.searchParams.get("type") ?? undefined,
    });

    if (!parsedQuery.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid activity query parameters",
          errors: parsedQuery.error.flatten(),
        },
        { status: 400 },
      );
    }

    const result = await getActivities({
      organizationId: organization.organizationId,
      page: parsedQuery.data.page,
      limit: parsedQuery.data.limit,
      type: parsedQuery.data.type,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 },
      );
    }

    console.error("GET /api/activity error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch activity" },
      { status: 500 },
    );
  }
}
