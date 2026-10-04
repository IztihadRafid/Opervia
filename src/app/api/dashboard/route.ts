import { NextResponse } from "next/server";

import { getApplicationCount } from "@/lib/services/application.service";
import { connectDB } from "@/lib/db/mongoose";
import { getMonthlySpend } from "@/lib/services/subscription.service";

const DEMO_ORGANIZATION_ID = "6ac0c5cc8e734b2c3c24d600";

export async function GET() {
  try {
    await connectDB();

    const [applications, monthlySpend] = await Promise.all([
      getApplicationCount(DEMO_ORGANIZATION_ID),
      getMonthlySpend(DEMO_ORGANIZATION_ID),
    ]);

    return NextResponse.json({
      success: true,
      metrics: {
        applications,
        monthlySpend,
      },
    });
  } catch (error) {
    console.error("Dashboard GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load dashboard data",
      },
      {
        status: 500,
      },
    );
  }
}
