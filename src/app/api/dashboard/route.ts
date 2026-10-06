import { NextResponse } from "next/server";
import {
  ForbiddenError,
  UnauthorizedError,
  requireOrganizationMembership,
} from "@/lib/auth/organization";

import { getApplicationCount } from "@/lib/services/application.service";
import { connectDB } from "@/lib/db/mongoose";
import { getMonthlySpend } from "@/lib/services/subscription.service";

export async function GET() {
  try {
    const organization = await requireOrganizationMembership(
      "6ac0c5cc8e734b2c3c24d600",
      "viewer",
    );

    await connectDB();

    const [applications, monthlySpend] = await Promise.all([
      getApplicationCount(organization.organizationId),
      getMonthlySpend(organization.organizationId),
    ]);

    return NextResponse.json({
      success: true,
      metrics: {
        applications,
        monthlySpend,
      },
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
