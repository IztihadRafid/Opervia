import { connectDB } from "@/lib/db/mongoose";
import {
  ForbiddenError,
  UnauthorizedError,
  requireOrganizationMembership,
} from "@/lib/auth/organization";
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

    const organization = await requireOrganizationMembership(
      "6ac0c5cc8e734b2c3c24d600",
    );

    const result = await getApplications(organization.organizationId, {
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

    const organization = await requireOrganizationMembership(
      "6ac0c5cc8e734b2c3c24d600",
    );

    const application = await createApplication(
      organization.organizationId,
      result.data,
    );

    const response: CreateApplicationResponse = {
      success: true,
      application,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Create application API error:", error);
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
