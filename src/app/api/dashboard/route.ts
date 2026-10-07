import { NextRequest, NextResponse } from "next/server";

import {
  ForbiddenError,
  UnauthorizedError,
  requireOrganizationMembership,
} from "@/lib/auth/organization";

import {
  getDashboardData,
  type DashboardRange,
} from "@/lib/services/dashboard.service";

import { connectDB } from "@/lib/db/mongoose";

const validRanges: DashboardRange[] = ["7d", "30d", "90d", "6m", "12m"];

export async function GET(request: NextRequest) {
  try {
    const rangeParam = request.nextUrl.searchParams.get("range") ?? "12m";

    const range: DashboardRange = validRanges.includes(
      rangeParam as DashboardRange,
    )
      ? (rangeParam as DashboardRange)
      : "12m";

    const organization = await requireOrganizationMembership(
      "6ac0c5cc8e734b2c3c24d600",
      "viewer",
    );

    await connectDB();

    const dashboard = await getDashboardData(
      organization.organizationId,
      range,
    );

    return NextResponse.json({
      success: true,
      ...dashboard,
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

    console.error("Dashboard GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load dashboard data",
      },
      { status: 500 },
    );
  }
}
