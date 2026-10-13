import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ForbiddenError,
  UnauthorizedError,
  requireOrganizationMembership,
} from "@/lib/auth/organization";
import { connectDB } from "@/lib/db/mongoose";
import Organization from "@/lib/db/models/Organization";

const updateOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name must not exceed 100 characters"),
});

export async function GET() {
  try {
    const membership = await requireOrganizationMembership("admin");
    await connectDB();

    const organization = await Organization.findById(membership.organizationId)
      .select("_id name slug createdAt updatedAt")
      .lean();

    if (!organization) {
      return NextResponse.json(
        { success: false, message: "Organization not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: organization._id.toString(),
        name: organization.name,
        slug: organization.slug,
        createdAt: organization.createdAt.toISOString(),
        updatedAt: organization.updatedAt.toISOString(),
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

    console.error("GET /api/organizations/settings failed:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load organization settings" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const membership = await requireOrganizationMembership("admin");
    await connectDB();

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const parsed = updateOrganizationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: parsed.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const organization = await Organization.findByIdAndUpdate(
      membership.organizationId,
      { $set: { name: parsed.data.name } },
      { returnDocument: "after", runValidators: true },
    )
      .select("_id name slug createdAt updatedAt")
      .lean();

    if (!organization) {
      return NextResponse.json(
        { success: false, message: "Organization not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Organization name updated successfully",
      data: {
        id: organization._id.toString(),
        name: organization.name,
        slug: organization.slug,
        createdAt: organization.createdAt.toISOString(),
        updatedAt: organization.updatedAt.toISOString(),
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

    console.error("PATCH /api/organizations/settings failed:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update organization settings" },
      { status: 500 },
    );
  }
}
