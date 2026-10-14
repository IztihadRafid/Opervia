import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import {
  ForbiddenError,
  UnauthorizedError,
  requireOrganizationMembership,
} from "@/lib/auth/organization";
import {
  deleteLicense,
  getLicenseById,
  updateLicense,
} from "@/lib/services/license.service";
import { updateLicenseSchema } from "@/lib/validations/license.validation";
import { createActivity } from "@/lib/services/activity.service";
interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    await connectDB();

    const { id } = await params;

    const organization = await requireOrganizationMembership();
    const license = await getLicenseById(organization.organizationId, id);

    if (!license) {
      return NextResponse.json(
        { success: false, message: "License not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      license,
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

    if (error instanceof Error && error.message === "Invalid license ID.") {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 },
      );
    }

    console.error("GET /api/licenses/[id] error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch license" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = updateLicenseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid license data",
          errors: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const organization = await requireOrganizationMembership();
    const license = await updateLicense(
      organization.organizationId,
      id,
      parsed.data,
    );

    if (!license) {
      return NextResponse.json(
        { success: false, message: "License not found" },
        { status: 404 },
      );
    }

    try {
      await createActivity({
        organizationId: organization.organizationId,
        userId: organization.userId,
        type: "license_updated",
        title: "License updated",
        description: `${license.name} was updated.`,
        entityId: license.id,
      });
    } catch (activityError) {
      console.error("Failed to log license update:", activityError);
    }

    return NextResponse.json({
      success: true,
      message: "License updated successfully",
      license,
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
      [
        "Invalid license ID.",
        "Invalid application ID.",
        "Application not found in this organization.",
        "Used seats cannot exceed total seats.",
        "Expiry date cannot be before the start date.",
      ].includes(error.message)
    ) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid license data",
          error: error.message,
        },
        { status: 400 },
      );
    }

    console.error("PATCH /api/licenses/[id] error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update license" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    await connectDB();

    const { id } = await params;
    const organization = await requireOrganizationMembership();

    const deleted = await deleteLicense(organization.organizationId, id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "License not found" },
        { status: 404 },
      );
    }

    try {
      await createActivity({
        organizationId: organization.organizationId,
        userId: organization.userId,
        type: "license_deleted",
        title: "License deleted",
        description: "A license was deleted.",
        entityId: id,
      });
    } catch (activityError) {
      console.error("Failed to log license deletion:", activityError);
    }

    return NextResponse.json({
      success: true,
      message: "License deleted successfully",
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

    if (error instanceof Error && error.message === "Invalid license ID.") {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 },
      );
    }

    console.error("DELETE /api/licenses/[id] error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to delete license" },
      { status: 500 },
    );
  }
}
