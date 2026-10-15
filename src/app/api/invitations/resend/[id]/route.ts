import { NextResponse } from "next/server";
import {
  ForbiddenError,
  UnauthorizedError,
  requireOrganizationMembership,
} from "@/lib/auth/organization";
import { resendInvitation } from "@/lib/services/invitation.service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const organization = await requireOrganizationMembership("admin");

    const { id } = await params;

    const { invitation, invitationUrl } = await resendInvitation({
      organizationId: organization.organizationId,
      invitationId: id,
    });

    return NextResponse.json({
      success: true,
      message:
        invitation.emailStatus === "sent"
          ? "Invitation resent successfully."
          : "Invitation link renewed, but the email could not be delivered. Share the new link directly.",
      data: {
        id: invitation._id.toString(),
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        emailStatus: invitation.emailStatus,
        invitationUrl,
      },
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

    if (error instanceof Error && error.message === "Invitation not found") {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 404 },
      );
    }

    if (
      error instanceof Error &&
      error.message === "Invitation has already been accepted"
    ) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 409 },
      );
    }

    if (
      error instanceof Error &&
      error.message === "Invitation has been revoked"
    ) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 409 },
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "Invitation was resent recently. Please wait before resending"
    ) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 429 },
      );
    }

    if (
      error instanceof Error &&
      error.message === "Invitation changed. Please try again"
    ) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 409 },
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
