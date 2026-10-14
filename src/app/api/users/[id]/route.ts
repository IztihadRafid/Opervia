import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import {
  ForbiddenError,
  UnauthorizedError,
  requireOrganizationMembership,
} from "@/lib/auth/organization";

import { connectDB } from "@/lib/db/mongoose";
import { updateUserSchema } from "@/lib/validations/user.validation";

import {
  deleteUser,
  getUserById,
  updateUser,
} from "@/lib/services/user.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const organization = await requireOrganizationMembership("admin");

    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid user ID" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);

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

    const targetUser = await getUserById(organization.organizationId, id);

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    if (targetUser.role === "owner" && organization.role !== "owner") {
      return NextResponse.json(
        {
          success: false,
          message: "Only owners can modify owner users",
        },
        { status: 403 },
      );
    }

    if (
      organization.role !== "owner" &&
      (parsed.data.role === "owner" || parsed.data.role === "admin")
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Only owners can assign admin or owner roles",
        },
        { status: 403 },
      );
    }

    if (parsed.data.role === "owner" && targetUser.role !== "owner") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot assign the owner role; ownership transfer is not supported",
        },
        { status: 409 },
      );
    }

    const user = await updateUser(organization.organizationId, id, parsed.data);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
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

    if (error instanceof Error) {
      if (error.message === "A user with this email already exists") {
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 409 },
        );
      }

      if (
        error.message ===
          "Cannot demote or suspend the last owner of an organization" ||
        error.message ===
          "Cannot assign the owner role; ownership transfer is not supported"
      ) {
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 409 },
        );
      }
    }

    console.error("User PATCH error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update user" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const organization = await requireOrganizationMembership("admin");

    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid user ID" },
        { status: 400 },
      );
    }

    const targetUser = await getUserById(organization.organizationId, id);

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    if (targetUser.role === "owner" && organization.role !== "owner") {
      return NextResponse.json(
        {
          success: false,
          message: "Only owners can delete owner users",
        },
        { status: 403 },
      );
    }

    const deletedUser = await deleteUser(organization.organizationId, id);

    if (!deletedUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
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

    if (
      error instanceof Error &&
      error.message === "Cannot delete the last owner of an organization"
    ) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 409 },
      );
    }

    console.error("User DELETE error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to delete user" },
      { status: 500 },
    );
  }
}
