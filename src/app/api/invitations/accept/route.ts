import { NextRequest, NextResponse } from "next/server";

import { acceptInvitation } from "@/lib/services/invitationAcceptance.service";

import { acceptInvitationSchema } from "@/lib/validations/acceptInvitation.validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const token = typeof body.token === "string" ? body.token.trim() : "";

    if (!token || token.length !== 64) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid invitation token",
        },
        { status: 400 },
      );
    }

    const parsed = acceptInvitationSchema.safeParse({
      name: body.name,
      password: body.password,
      confirmPassword: body.confirmPassword,
    });

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

    const result = await acceptInvitation({
      token,
      name: parsed.data.name,
      password: parsed.data.password,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Invitation accepted successfully",
        data: result,
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Invalid invitation token"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 400 },
      );
    }

    if (
      error instanceof Error &&
      error.message === "Invitation is invalid or has expired"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 400 },
      );
    }

    if (
      error instanceof Error &&
      error.message === "A user with this email already exists"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 409 },
      );
    }

    console.error("Invitation acceptance error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to accept invitation",
      },
      { status: 500 },
    );
  }
}
