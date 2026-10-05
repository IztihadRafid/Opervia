import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { requireRole } from "@/lib/auth/authorization";

const DEMO_ORGANIZATION_ID = "6ac0c5cc8e734b2c3c24d600";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const membership = await requireRole(
      session.user.id,
      DEMO_ORGANIZATION_ID,
      "admin",
    );

    return NextResponse.json({
      success: true,
      message: "Authorization successful",
      role: membership.role,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden",
        },
        { status: 403 },
      );
    }

    console.error("Authorization test error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Authorization test failed",
      },
      { status: 500 },
    );
  }
}
