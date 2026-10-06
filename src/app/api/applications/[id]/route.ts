import { NextResponse } from "next/server";
import mongoose from "mongoose";
import {
  ForbiddenError,
  UnauthorizedError,
  requireOrganizationMembership,
} from "@/lib/auth/organization";
import {
  deleteApplication,
  updateApplicationSchema,
} from "@/lib/validations/application.validation";
import { updateApplication } from "@/lib/services/application.service";
import { CreateApplicationResponse } from "../../../../../types/api";
import { connectDB } from "@/lib/db/mongoose";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid application ID",
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    const result = updateApplicationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid application data",
          errors: result.error.issues,
        },
        { status: 400 },
      );
    }
    const organization = await requireOrganizationMembership(
      "6ac0c5cc8e734b2c3c24d600",
    );
    const application = await updateApplication(
      organization.organizationId,
      id,
      result.data,
    );

    if (!application) {
      return NextResponse.json(
        {
          success: false,
          message: "Application not found",
        },
        { status: 404 },
      );
    }

    const response: CreateApplicationResponse = {
      success: true,
      application,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 401 },
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 403 },
      );
    }

    console.error("Update application API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update application",
      },
      { status: 500 },
    );
  }
}
export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid application ID",
        },
        { status: 400 },
      );
    }
    const organization = await requireOrganizationMembership(
      "6ac0c5cc8e734b2c3c24d600",
    );
    const application = await deleteApplication(
      organization.organizationId,
      id,
    );

    if (!application) {
      return NextResponse.json(
        {
          success: false,
          message: "Application not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Application deleted successfully",
      application,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 401 },
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 403 },
      );
    }

    console.error("Delete application API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete application",
      },
      { status: 500 },
    );
  }
}
