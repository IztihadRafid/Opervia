import { connectDB } from "@/lib/db/mongoose";
import { createUser, getUsers } from "@/lib/services/user.service";
import { createUserSchema } from "@/lib/validations/user.validation";
import { NextRequest, NextResponse } from "next/server";

const DEMO_ORGANIZATION_ID = "6ac0c5cc8e734b2c3c24d600";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 20);

    const statusParam = searchParams.get("status");
    const search = searchParams.get("search") ?? undefined;
    const roleParam = searchParams.get("role");
    const role =
      roleParam === "owner" ||
      roleParam === "admin" ||
      roleParam === "member" ||
      roleParam === "viewer"
        ? roleParam
        : undefined;
    const status =
      statusParam === "active" ||
      statusParam === "invited" ||
      statusParam === "suspended"
        ? statusParam
        : undefined;

    const result = await getUsers(DEMO_ORGANIZATION_ID, {
      page,
      limit,
      status,
      search,
      role,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Users GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load users",
      },
      { status: 500 },
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const user = await createUser(DEMO_ORGANIZATION_ID, parsed.data);

    return NextResponse.json(
      {
        success: true,
        data: user,
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "A user with this email already exists"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 409 },
      );
    }

    console.error("Users POST error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create user",
      },
      { status: 500 },
    );
  }
}
