import { NextResponse } from "next/server";

import { requestPasswordReset } from "@/lib/services/passwordReset.service";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .check(z.email("Invalid email address"))
    .max(254),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message ?? "Invalid email address",
        },
        {
          status: 400,
        },
      );
    }

    await requestPasswordReset(parsed.data.email);

    return NextResponse.json(
      {
        success: true,
        message:
          "If an account exists with this email, a password reset link has been sent.",
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Forgot password error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to process your request. Please try again later.",
      },
      {
        status: 500,
      },
    );
  }
}
