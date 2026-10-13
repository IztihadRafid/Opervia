import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import {
  ForbiddenError,
  UnauthorizedError,
  requireOrganizationMembership,
} from "@/lib/auth/organization";
import { createExpense, getExpenses } from "@/lib/services/expense.service";
import { createExpenseSchema } from "@/lib/validations/expense.validation";
import { createActivity } from "@/lib/services/activity.service";
const getExpensesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(150).optional(),
  status: z.enum(["paid", "pending", "overdue", "cancelled"]).optional(),
  category: z
    .enum([
      "software",
      "hardware",
      "cloud_hosting",
      "marketing",
      "office",
      "travel",
      "professional_services",
      "other",
    ])
    .optional(),
  vendorId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, "Invalid vendor ID.")
    .optional(),
  applicationId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, "Invalid application ID.")
    .optional(),
});

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

function handleExpenseInputError(error: unknown) {
  if (!(error instanceof Error)) return null;

  if (
    error.message === "Invalid vendor ID." ||
    error.message === "Vendor not found in this organization." ||
    error.message === "Invalid application ID." ||
    error.message === "Application not found in this organization."
  ) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 },
    );
  }

  if (error.name === "ValidationError") {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid expense data",
        error: error.message,
      },
      { status: 400 },
    );
  }

  return null;
}

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    const parsed = getExpensesSchema.safeParse(query);

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

    const organization = await requireOrganizationMembership("admin");

    const result = await getExpenses(organization.organizationId, parsed.data);

    return NextResponse.json({
      success: true,
      expenses: result.expenses,
      pagination: result.pagination,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    if (
      error instanceof Error &&
      (error.message === "Invalid vendor ID." ||
        error.message === "Invalid application ID.")
    ) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 },
      );
    }

    console.error("GET /api/expenses error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch expenses" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json().catch(() => null);
    const parsed = createExpenseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid expense data",
          errors: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const organization = await requireOrganizationMembership("admin");
    const expense = await createExpense(
      organization.organizationId,
      parsed.data,
    );
    try {
      await createActivity({
        organizationId: organization.organizationId,
        userId: organization.userId,
        type: "expense_created",
        title: "Expense created",
        description: `${expense.title} was added to expenses.`,
        entityId: expense.id,
      });
    } catch (activityError) {
      console.error("Failed to log expense creation:", activityError);
    }
    return NextResponse.json(
      {
        success: true,
        message: "Expense created successfully",
        expense,
      },
      { status: 201 },
    );
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    const inputErrorResponse = handleExpenseInputError(error);
    if (inputErrorResponse) return inputErrorResponse;

    console.error("POST /api/expenses error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to create expense" },
      { status: 500 },
    );
  }
}
