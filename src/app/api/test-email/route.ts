import { NextResponse } from "next/server";

import { sendInvitationEmail } from "@/lib/email/sendInvitationEmail";

export async function POST() {
  try {
    const testRecipient = process.env.TEST_EMAIL;

    if (!testRecipient) {
      return NextResponse.json(
        {
          success: false,
          message: "TEST_EMAIL is not configured",
        },
        { status: 500 },
      );
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await sendInvitationEmail({
      to: testRecipient,
      organizationName: "Opervia Demo",
      inviterName: "Alex Morgan",
      role: "member",
      invitationUrl: "http://localhost:3000/invite/test-token",
      expiresAt,
    });

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully",
    });
  } catch (error) {
    console.error("Test email error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to send test email",
      },
      { status: 500 },
    );
  }
}
