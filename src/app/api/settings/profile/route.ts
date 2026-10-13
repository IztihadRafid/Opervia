import { NextRequest, NextResponse } from "next/server";
import {
  ForbiddenError,
  UnauthorizedError,
  requireOrganizationMembership,
} from "@/lib/auth/organization";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/db/models/User";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),
});

export async function GET() {
  try {
    const organization = await requireOrganizationMembership();
    await connectDB();

    const user = await User.findOne({
      _id: organization.userId,
      organizationId: organization.organizationId,
    })
      .select("_id name email role status emailVerifiedAt createdAt")
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Profile not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
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

    console.error("Profile GET error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load profile" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const organization = await requireOrganizationMembership();
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

    const parsed = updateProfileSchema.safeParse(body);

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

    const user = await User.findOneAndUpdate(
      {
        _id: organization.userId,
        organizationId: organization.organizationId,
      },
      {
        $set: { name: parsed.data.name },
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    )
      .select("_id name email role status emailVerifiedAt createdAt")
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Profile not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
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

    console.error("Profile PATCH error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update profile" },
      { status: 500 },
    );
  }
}
