import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongoose";
import Organization from "@/lib/db/models/Organization";
import Membership from "@/lib/db/models/Membership";
import { getMembershipsForUser } from "@/lib/services/membership.service";

const createOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name cannot exceed 100 characters"),
});

function createSlugBase(name: string) {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90)
    .replace(/-+$/g, "");

  return slug || "organization";
}

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

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const parsed = createOrganizationSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: parsed.error.issues[0]?.message ?? "Invalid organization name",
      },
      { status: 400 },
    );
  }

  if (!mongoose.Types.ObjectId.isValid(session.user.id)) {
    return NextResponse.json(
      { message: "Invalid user session" },
      { status: 401 },
    );
  }

  await connectDB();

  const userId = new mongoose.Types.ObjectId(session.user.id);
  const baseSlug = createSlugBase(parsed.data.name);

  const dbSession = await mongoose.startSession();
  let createdOrganization: {
    id: string;
    name: string;
    slug: string;
    role: "owner";
  } | null = null;

  try {
    await dbSession.withTransaction(async () => {
      let slug = baseSlug;
      let suffix = 1;

      while (await Organization.exists({ slug }).session(dbSession)) {
        suffix += 1;
        slug = `${baseSlug.slice(0, 90 - String(suffix).length - 1)}-${suffix}`;
      }

      const [organization] = await Organization.create(
        [
          {
            name: parsed.data.name,
            slug,
          },
        ],
        { session: dbSession },
      );

      await Membership.create(
        [
          {
            userId,
            organizationId: organization._id,
            role: "owner",
            status: "active",
          },
        ],
        { session: dbSession },
      );

      createdOrganization = {
        id: String(organization._id),
        name: organization.name,
        slug: organization.slug,
        role: "owner",
      };
    });

    if (!createdOrganization) {
      throw new Error("Organization creation did not complete");
    }

    return NextResponse.json(
      { organization: createdOrganization },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof mongoose.mongo.MongoServerError &&
      error.code === 11000
    ) {
      return NextResponse.json(
        {
          message:
            "An organization with that slug already exists. Please try again.",
        },
        { status: 409 },
      );
    }

    console.error("POST /api/organizations failed:", error);

    return NextResponse.json(
      { message: "Failed to create organization" },
      { status: 500 },
    );
  } finally {
    await dbSession.endSession();
  }
}
