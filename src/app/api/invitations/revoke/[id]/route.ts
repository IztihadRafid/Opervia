import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import {
  ForbiddenError,
  UnauthorizedError,
  requireOrganizationMembership,
} from "@/lib/auth/organization";
import { revokeInvitation } from "@/lib/services/invitation.service";
import { createActivity } from "@/lib/services/activity.service";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const organization = await requireOrganizationMembership(
      "6ac0c5cc8e734b2c3c24d600",
      "admin",
    );

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

    const invitation = await revokeInvitation({
      organizationId: organization.organizationId,
      invitationId: id,
    });

    try {
      await createActivity({
        organizationId: organization.organizationId,
        userId: organization.userId,
        type: "invitation_revoked",
        title: "Invitation revoked",
        description: `The invitation for ${invitation.email} was revoked.`,
        entityId: invitation._id.toString(),
      });
    } catch (activityError) {
      console.error("Failed to log invitation revocation:", activityError);
    }

    return NextResponse.json({
      success: true,
      message: "Invitation revoked successfully",
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
