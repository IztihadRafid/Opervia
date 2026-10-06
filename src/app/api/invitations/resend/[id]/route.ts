import { NextResponse } from "next/server";

import {
  ForbiddenError,
  UnauthorizedError,
  requireOrganizationMembership,
} from "@/lib/auth/organization";

import { EmailDeliveryError } from "@/lib/email/email-error";

import { resendInvitation } from "@/lib/services/invitation.service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const organization = await requireOrganizationMembership(
      "6ac0c5cc8e734b2c3c24d600",
      "admin",
    );

    const { id } = await params;

    const { invitation } = await resendInvitation({
      organizationId: organization.organizationId,
      invitationId: id,
    });

    return NextResponse.json({
      success: true,
      message: "Invitation resent successfully",
      data: {
        id: invitation._id.toString(),
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        emailStatus: invitation.emailStatus,
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

    if (error instanceof Error && error.message === "Invitation not found") {
      return NextResponse.json(
        {
          success: false,
          message: "Invitation not found",
        },
        { status: 404 },
      );
    }

    if (
      error instanceof Error &&
      error.message === "Invitation has already been accepted"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 409 },
      );
    }

    if (
      error instanceof Error &&
      error.message === "Invitation has been revoked"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 409 },
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "Invitation was resent recently. Please wait before resending"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 429 },
      );
    }

    if (
      error instanceof Error &&
      error.message === "Invitation changed. Please try again"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 409 },
      );
    }

    if (error instanceof EmailDeliveryError) {
      console.error("Invitation email delivery error:", error);

      return NextResponse.json(
        {
          success: false,
          message:
            "Invitation was updated, but the email could not be delivered.",
        },
        { status: 502 },
      );
    }

    console.error("Invitation resend error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to resend invitation",
      },
      { status: 500 },
    );
  }
}
