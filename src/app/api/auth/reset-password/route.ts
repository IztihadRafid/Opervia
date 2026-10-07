import { NextResponse } from "next/server";

import { resetPassword } from "@/lib/services/passwordReset.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const token = typeof body?.token === "string" ? body.token : "";

    const password = typeof body?.password === "string" ? body.password : "";

    if (!token || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Reset token and password are required.",
        },
        {
          status: 400,
        },
      );
    }

    await resetPassword({
      token,
      password,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Your password has been reset successfully.",
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to reset password.";

    if (message === "Invalid or expired password reset token") {
      return NextResponse.json(
        {
          success: false,
          message,
        },
        {
          status: 400,
        },
      );
    }

    if (message === "Password must be at least 8 characters") {
      return NextResponse.json(
        {
          success: false,
          message,
        },
        {
          status: 400,
        },
      );
    }

    if (message === "Password must not exceed 128 characters") {
      return NextResponse.json(
        {
          success: false,
          message,
        },
        {
          status: 400,
        },
      );
    }

    console.error("Reset password error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to reset your password. Please try again later.",
      },
      {
        status: 500,
      },
    );
  }
}
