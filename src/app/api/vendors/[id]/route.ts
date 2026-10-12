import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import {
  ForbiddenError,
  UnauthorizedError,
  requireOrganizationMembership,
} from "@/lib/auth/organization";
import {
  deleteVendor,
  getVendors,
  updateVendor,
} from "@/lib/services/vendor.service";
import { updateVendorSchema } from "@/lib/validations/vendor.validation";
import Vendor from "@/lib/db/models/Vendor";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function handleAuthError(error: unknown) {
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

  return null;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await connectDB();

    const organization = await requireOrganizationMembership();
    const { id } = await context.params;

    const vendor = await Vendor.findOne({
      _id: id,
      organizationId: organization.organizationId,
    }).lean();

    if (!vendor) {
      return NextResponse.json(
        { success: false, message: "Vendor not found" },
        { status: 404 },
      );
    }

    const result = await getVendors(organization.organizationId, {
      page: 1,
      limit: 100,
      search: vendor.name,
    });

    const matchedVendor = result.vendors.find(
      (item) => item._id === String(vendor._id),
    );

    if (!matchedVendor) {
      return NextResponse.json(
        { success: false, message: "Vendor not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      vendor: matchedVendor,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    console.error("GET /api/vendors/[id] error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch vendor" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await connectDB();

    const organization = await requireOrganizationMembership();
    const { id } = await context.params;

    const body = await request.json().catch(() => null);
    const parsed = updateVendorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid vendor data",
          errors: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const vendor = await updateVendor(
      organization.organizationId,
      id,
      parsed.data,
    );

    if (!vendor) {
      return NextResponse.json(
        { success: false, message: "Vendor not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Vendor updated successfully",
      vendor,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A vendor with this name already exists in your organization",
        },
        { status: 409 },
      );
    }

    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid vendor data",
          error: error.message,
        },
        { status: 400 },
      );
    }

    console.error("PATCH /api/vendors/[id] error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update vendor" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await connectDB();

    const organization = await requireOrganizationMembership();
    const { id } = await context.params;

    const result = await deleteVendor(organization.organizationId, id);

    if (!result) {
      return NextResponse.json(
        { success: false, message: "Vendor not found" },
        { status: 404 },
      );
    }

    if (!result.deleted) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This vendor cannot be deleted while applications still reference it.",
          linkedApplicationCount: result.linkedApplicationCount,
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Vendor deleted successfully",
    });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    console.error("DELETE /api/vendors/[id] error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to delete vendor" },
      { status: 500 },
    );
  }
}
