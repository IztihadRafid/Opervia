import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongoose";
import { getMembershipsForUser } from "@/lib/services/membership.service";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const memberships = await getMembershipsForUser(session.user.id);

    const organizations = memberships.flatMap((membership) => {
      const organization = membership.organizationId;

      if (
        !organization ||
        typeof organization !== "object" ||
        !("_id" in organization)
      ) {
        return [];
      }

      return [
        {
          id: String(organization._id),
          name: "name" in organization ? organization.name : "",
          slug: "slug" in organization ? organization.slug : "",
          role: membership.role,
        },
      ];
    });

    return NextResponse.json({ organizations });
  } catch (error) {
    console.error("GET /api/organizations failed:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
