import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import {
  ForbiddenError,
  UnauthorizedError,
  requireOrganizationMembership,
} from "@/lib/auth/organization";
import { createLicense, getLicenses } from "@/lib/services/license.service";
import { createLicenseSchema } from "@/lib/validations/license.validation";
import { z } from "zod";

const getLicensesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(150).optional(),
  status: z.enum(["active", "expired", "suspended", "cancelled"]).optional(),
  applicationId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, "Invalid application ID.")
    .optional(),
});

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    const parsed = getLicensesSchema.safeParse(query);

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

    const result = await getLicenses(organization.organizationId, parsed.data);

    return NextResponse.json({
      success: true,
      licenses: result.data,
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

    console.error("GET /api/licenses error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch licenses" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json().catch(() => null);
    const parsed = createLicenseSchema.safeParse(body);

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

    const license = await createLicense(
      organization.organizationId,
      parsed.data,
    );

    return NextResponse.json(
      {
        success: true,
        message: "License created successfully",
        license,
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
      error instanceof Error &&
      (error.message === "Invalid application ID." ||
        error.message === "Application not found in this organization." ||
        error.message === "Used seats cannot exceed total seats." ||
        error.message === "Expiry date cannot be before the start date.")
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

    console.error("POST /api/licenses error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to create license" },
      { status: 500 },
    );
  }
}
