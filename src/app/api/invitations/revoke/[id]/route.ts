import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { requireRole } from "@/lib/auth/authorization";
import { revokeInvitation } from "@/lib/services/invitation.service";

const DEMO_ORGANIZATION_ID = "6ac0c5cc8e734b2c3c24d600";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

  try {
    await requireRole(session.user.id, DEMO_ORGANIZATION_ID, "admin");

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid invitation ID",
        },
        { status: 400 },
      );
    }

    await revokeInvitation({
      organizationId: DEMO_ORGANIZATION_ID,
      invitationId: id,
    });

    return NextResponse.json({
      success: true,
      message: "Invitation revoked successfully",
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

    if (error instanceof Error && error.message === "Invitation not found") {
      return NextResponse.json(
        {
          success: false,
          message: "Invitation not found",
        },
        { status: 404 },
      );
    }

    console.error("Invitation DELETE error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to revoke invitation",
      },
      { status: 500 },
    );
  }
}
