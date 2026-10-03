import { connectDB } from "@/lib/db/mongoose";

import {
  createApplication,
  getApplications,
} from "@/lib/services/application.service";

import {
  createApplicationSchema,
  getApplicationsSchema,
} from "@/lib/validations/application.validation";

import { NextResponse } from "next/server";
import {
  ApplicationsResponse,
  CreateApplicationResponse,
} from "../../../../types/api";

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const query = Object.fromEntries(searchParams.entries());

    const queryResult = getApplicationsSchema.safeParse(query);

    if (!queryResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid query parameters",
          errors: queryResult.error.issues,
        },
        { status: 400 },
      );
    }

    const { page, limit, status, search } = queryResult.data;

    const result = await getApplications("6ac0c5cc8e734b2c3c24d600", {
      page,
      limit,
      status,
      search,
    });

    const response: ApplicationsResponse = {
      success: true,
      applications: result.applications,
      pagination: result.pagination,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Applications API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch applications",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();

    const result = createApplicationSchema.safeParse(body);

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

    const application = await createApplication(
      "6ac0c5cc8e734b2c3c24d600",
      result.data,
    );

    const response: CreateApplicationResponse = {
      success: true,
      application,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Create application API error:", error);

    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid application data",
          error: error.message,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create application",
      },
      { status: 500 },
    );
  }
}
