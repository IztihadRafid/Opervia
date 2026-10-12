import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import {
  ForbiddenError,
  UnauthorizedError,
  requireOrganizationMembership,
} from "@/lib/auth/organization";
import { createVendor, getVendors } from "@/lib/services/vendor.service";
import {
  createVendorSchema,
  getVendorsSchema,
} from "@/lib/validations/vendor.validation";

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    const parsed = getVendorsSchema.safeParse(query);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid query parameters",
          errors: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const organization = await requireOrganizationMembership();

    const result = await getVendors(organization.organizationId, parsed.data);

    return NextResponse.json({
      success: true,
      vendors: result.vendors,
      pagination: result.pagination,
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

    console.error("GET /api/vendors error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch vendors" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json().catch(() => null);
    const parsed = createVendorSchema.safeParse(body);

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

    const organization = await requireOrganizationMembership();

    const vendor = await createVendor(organization.organizationId, parsed.data);

    return NextResponse.json(
      {
        success: true,
        message: "Vendor created successfully",
        vendor,
      },
      { status: 201 },
    );
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

    console.error("POST /api/vendors error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to create vendor" },
      { status: 500 },
    );
  }
}
