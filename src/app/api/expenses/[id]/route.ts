import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import {
  ForbiddenError,
  UnauthorizedError,
  requireOrganizationMembership,
} from "@/lib/auth/organization";
import {
  deleteExpense,
  getExpenseById,
  updateExpense,
} from "@/lib/services/expense.service";
import { updateExpenseSchema } from "@/lib/validations/expense.validation";

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

function handleExpenseInputError(error: unknown) {
  if (!(error instanceof Error)) return null;

  if (
    [
      "Invalid expense ID.",
      "Invalid vendor ID.",
      "Vendor not found in this organization.",
      "Invalid application ID.",
      "Application not found in this organization.",
      "Due date cannot be before the expense date.",
    ].includes(error.message)
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

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    await connectDB();

    const { id } = await params;
    const organization = await requireOrganizationMembership();

    const expense = await getExpenseById(organization.organizationId, id);

    if (!expense) {
      return NextResponse.json(
        { success: false, message: "Expense not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      expense,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    const inputErrorResponse = handleExpenseInputError(error);
    if (inputErrorResponse) return inputErrorResponse;

    console.error("GET /api/expenses/[id] error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch expense" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = updateExpenseSchema.safeParse(body);

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

    const organization = await requireOrganizationMembership();

    const expense = await updateExpense(
      organization.organizationId,
      id,
      parsed.data,
    );

    if (!expense) {
      return NextResponse.json(
        { success: false, message: "Expense not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Expense updated successfully",
      expense,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    const inputErrorResponse = handleExpenseInputError(error);
    if (inputErrorResponse) return inputErrorResponse;

    console.error("PATCH /api/expenses/[id] error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update expense" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    await connectDB();

    const { id } = await params;
    const organization = await requireOrganizationMembership();

    const deleted = await deleteExpense(organization.organizationId, id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Expense not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    const inputErrorResponse = handleExpenseInputError(error);
    if (inputErrorResponse) return inputErrorResponse;

    console.error("DELETE /api/expenses/[id] error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to delete expense" },
      { status: 500 },
    );
  }
}
