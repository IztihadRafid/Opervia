import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { requireRole } from "@/lib/auth/authorization";
import { createInvitation } from "@/lib/services/invitation.service";
import { createInvitationSchema } from "@/lib/validations/invitation.validation";
import { connectDB } from "@/lib/db/mongoose";
import Invitation from "@/lib/db/models/Invitation";

const DEMO_ORGANIZATION_ID = "6ac0c5cc8e734b2c3c24d600";

export async function POST(request: NextRequest) {
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
    const membership = await requireRole(
      session.user.id,
      DEMO_ORGANIZATION_ID,
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

    if (membership.role === "admin" && parsed.data.role === "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Admins cannot invite other admins",
        },
        { status: 403 },
      );
    }

    const { invitation, token } = await createInvitation({
      organizationId: DEMO_ORGANIZATION_ID,
      email: parsed.data.email,
      role: parsed.data.role,
      invitedBy: session.user.id,
    });

    const invitationUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/invite/${token}`;

    return NextResponse.json(
      {
        success: true,
        message: "Invitation created successfully",
        data: {
          id: invitation._id,
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expiresAt,
          invitationUrl,
        },
      },
      { status: 201 },
    );
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
export async function GET() {
  await connectDB();

  const invitations = await Invitation.find({
    email: "invite-admin-test@opervia-demo.com",
  })
    .select("email role expiresAt acceptedAt createdAt")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({
    success: true,
    data: invitations,
  });
}
