import { NextRequest, NextResponse } from "next/server";

import {
  ForbiddenError,
  UnauthorizedError,
  requireOrganizationMembership,
} from "@/lib/auth/organization";

import {
  createInvitation,
  getInvitations,
} from "@/lib/services/invitation.service";

import { createInvitationSchema } from "@/lib/validations/invitation.validation";

import { EmailDeliveryError } from "@/lib/email/email-error";

export async function POST(request: NextRequest) {
  try {
    const organization = await requireOrganizationMembership(
      "6ac0c5cc8e734b2c3c24d600",
      "admin",
    );

    const body = await request.json();

    const parsed = createInvitationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    if (organization.role === "admin" && parsed.data.role === "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Admins cannot invite other admins",
        },
        { status: 403 },
      );
    }

    const { invitation } = await createInvitation({
      organizationId: organization.organizationId,
      email: parsed.data.email,
      role: parsed.data.role,
      invitedBy: organization.userId,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Invitation sent successfully",
        data: {
          id: invitation._id,
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expiresAt,
          emailStatus: invitation.emailStatus,
        },
      },
      { status: 201 },
    );
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

    if (
      error instanceof Error &&
      error.message === "An active invitation already exists for this email"
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
      error.message === "This user is already a member of the organization"
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
            "Invitation was created, but the email could not be delivered.",
        },
        { status: 502 },
      );
    }

    console.error("Invitation POST error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create invitation",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const organization = await requireOrganizationMembership(
      "6ac0c5cc8e734b2c3c24d600",
      "member",
    );

    const searchParams = request.nextUrl.searchParams;

    const pageParam = Number(searchParams.get("page") ?? "1");
    const limitParam = Number(searchParams.get("limit") ?? "25");

    const page = Number.isFinite(pageParam)
      ? Math.max(1, Math.floor(pageParam))
      : 1;

    const limit = Number.isFinite(limitParam)
      ? Math.min(100, Math.max(1, Math.floor(limitParam)))
      : 25;

    const result = await getInvitations({
      organizationId: organization.organizationId,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      ...result,
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

    console.error("Invitation GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load invitations",
      },
      { status: 500 },
    );
  }
}
