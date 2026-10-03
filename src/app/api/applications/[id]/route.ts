import { NextResponse } from "next/server";
import mongoose from "mongoose";

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

    const application = await updateApplication(
      "6ac0c5cc8e734b2c3c24d600",
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

    const application = await deleteApplication("6ac0c5cc8e734b2c3c24d600", id);

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
