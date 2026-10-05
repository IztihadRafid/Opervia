import { NextResponse } from "next/server";
import { getInvitationDetails } from "@/lib/services/invitation.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    const invitation = await getInvitationDetails(token);

    if (!invitation) {
      return NextResponse.json(
        {
          success: false,
          message: "Invitation is invalid or has expired",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: invitation,
    });
  } catch (error) {
    console.error("Invitation GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load invitation",
      },
      { status: 500 },
    );
  }
}
