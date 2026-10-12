import { Types } from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import Expense, { type IExpense } from "@/lib/db/models/Expense";
import Vendor from "@/lib/db/models/Vendor";
import Application from "@/lib/db/models/Application";
import {
  createExpenseSchema,
  updateExpenseSchema,
  type CreateExpenseInput,
  type UpdateExpenseInput,
} from "@/lib/validations/expense.validation";

type ExpenseStatus = "paid" | "pending" | "overdue" | "cancelled";
type ExpenseCategory =
  | "software"
  | "hardware"
  | "cloud_hosting"
  | "marketing"
  | "office"
  | "travel"
  | "professional_services"
  | "other";

export interface GetExpensesOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: ExpenseStatus;
  category?: ExpenseCategory;
  vendorId?: string;
  applicationId?: string;
}

function serializeExpense(expense: IExpense) {
  return {
    id: expense._id.toString(),
    organizationId: expense.organizationId.toString(),
    vendorId: expense.vendorId?.toString() ?? null,
    applicationId: expense.applicationId?.toString() ?? null,
    title: expense.title,
    description: expense.description ?? "",
    category: expense.category,
    amount: expense.amount,
    currency: expense.currency,
    expenseDate: expense.expenseDate.toISOString(),
    dueDate: expense.dueDate?.toISOString() ?? null,
    status: expense.status,
    paymentMethod: expense.paymentMethod ?? null,
    invoiceNumber: expense.invoiceNumber ?? "",
    notes: expense.notes ?? "",
    createdAt: expense.createdAt.toISOString(),
    updatedAt: expense.updatedAt.toISOString(),
  };
}

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function assertVendorBelongsToOrganization(
  vendorId: string | null | undefined,
  organizationId: Types.ObjectId,
) {
  if (!vendorId) return;

  if (!Types.ObjectId.isValid(vendorId)) {
    throw new Error("Invalid vendor ID.");
  }

  const vendor = await Vendor.findOne({
    _id: vendorId,
    organizationId,
  })
    .select("_id")
    .lean();

  if (!vendor) {
    throw new Error("Vendor not found in this organization.");
  }
}

async function assertApplicationBelongsToOrganization(
  applicationId: string | null | undefined,
  organizationId: Types.ObjectId,
) {
  if (!applicationId) return;

  if (!Types.ObjectId.isValid(applicationId)) {
    throw new Error("Invalid application ID.");
  }

  const application = await Application.findOne({
    _id: applicationId,
    organizationId,
  })
    .select("_id")
    .lean();

  if (!application) {
    throw new Error("Application not found in this organization.");
  }
}

export async function getExpenses(
  organizationId: string,
  options: GetExpensesOptions = {},
) {
  await connectDB();

  const page = Math.max(1, Math.floor(options.page ?? 1));
  const limit = Math.min(100, Math.max(1, Math.floor(options.limit ?? 25)));

  const orgId = new Types.ObjectId(organizationId);

  const filter: Record<string, unknown> = {
    organizationId: orgId,
  };

  if (options.status) {
    filter.status = options.status;
  }

  if (options.category) {
    filter.category = options.category;
  }

  if (options.vendorId) {
    if (!Types.ObjectId.isValid(options.vendorId)) {
      throw new Error("Invalid vendor ID.");
    }

    filter.vendorId = new Types.ObjectId(options.vendorId);
  }

  if (options.applicationId) {
    if (!Types.ObjectId.isValid(options.applicationId)) {
      throw new Error("Invalid application ID.");
    }

    filter.applicationId = new Types.ObjectId(options.applicationId);
  }

  if (options.search?.trim()) {
    const search = new RegExp(escapeRegex(options.search.trim()), "i");

    filter.$or = [
      { title: search },
      { description: search },
      { invoiceNumber: search },
    ];
  }

  const [expenses, total] = await Promise.all([
    Expense.find(filter)
      .sort({ expenseDate: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    Expense.countDocuments(filter),
  ]);

  return {
    expenses: expenses.map((expense) =>
      serializeExpense(expense as unknown as IExpense),
    ),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getExpenseById(
  organizationId: string,
  expenseId: string,
) {
  await connectDB();

  if (!Types.ObjectId.isValid(expenseId)) {
    throw new Error("Invalid expense ID.");
  }

  const expense = await Expense.findOne({
    _id: new Types.ObjectId(expenseId),
    organizationId: new Types.ObjectId(organizationId),
  }).lean();

  if (!expense) {
    return null;
  }

  return serializeExpense(expense as unknown as IExpense);
}

export async function createExpense(
  organizationId: string,
  input: CreateExpenseInput,
) {
  await connectDB();

  const parsed = createExpenseSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues.map((issue) => issue.message).join(" "),
    );
  }

  const orgId = new Types.ObjectId(organizationId);
  const data = parsed.data;

  await Promise.all([
    assertVendorBelongsToOrganization(data.vendorId, orgId),
    assertApplicationBelongsToOrganization(data.applicationId, orgId),
  ]);

  const expense = await Expense.create({
    organizationId: orgId,
    vendorId: data.vendorId ? new Types.ObjectId(data.vendorId) : undefined,
    applicationId: data.applicationId
      ? new Types.ObjectId(data.applicationId)
      : undefined,
    title: data.title,
    description: data.description ?? undefined,
    category: data.category,
    amount: data.amount,
    currency: data.currency,
    expenseDate: parseDate(data.expenseDate),
    dueDate: data.dueDate ? parseDate(data.dueDate) : undefined,
    status: data.status,
    paymentMethod: data.paymentMethod ?? undefined,
    invoiceNumber: data.invoiceNumber ?? undefined,
    notes: data.notes ?? undefined,
  });

  return serializeExpense(expense);
}

export async function updateExpense(
  organizationId: string,
  expenseId: string,
  input: UpdateExpenseInput,
) {
  await connectDB();

  if (!Types.ObjectId.isValid(expenseId)) {
    throw new Error("Invalid expense ID.");
  }

  const parsed = updateExpenseSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues.map((issue) => issue.message).join(" "),
    );
  }

  const orgId = new Types.ObjectId(organizationId);

  const existing = await Expense.findOne({
    _id: new Types.ObjectId(expenseId),
    organizationId: orgId,
  });

  if (!existing) {
    return null;
  }

  const data = parsed.data;

  const nextVendorId =
    data.vendorId === undefined
      ? existing.vendorId?.toString()
      : (data.vendorId ?? undefined);

  const nextApplicationId =
    data.applicationId === undefined
      ? existing.applicationId?.toString()
      : (data.applicationId ?? undefined);

  const nextExpenseDate =
    data.expenseDate === undefined
      ? existing.expenseDate
      : parseDate(data.expenseDate);

  const nextDueDate =
    data.dueDate === undefined
      ? existing.dueDate
      : data.dueDate
        ? parseDate(data.dueDate)
        : undefined;

  if (nextDueDate && nextDueDate < nextExpenseDate) {
    throw new Error("Due date cannot be before the expense date.");
  }

  await Promise.all([
    assertVendorBelongsToOrganization(nextVendorId, orgId),
    assertApplicationBelongsToOrganization(nextApplicationId, orgId),
  ]);

  if (data.vendorId !== undefined) {
    existing.vendorId = data.vendorId
      ? new Types.ObjectId(data.vendorId)
      : undefined;
  }

  if (data.applicationId !== undefined) {
    existing.applicationId = data.applicationId
      ? new Types.ObjectId(data.applicationId)
      : undefined;
  }

  if (data.title !== undefined) existing.title = data.title;
  if (data.description !== undefined) {
    existing.description = data.description ?? undefined;
  }
  if (data.category !== undefined) existing.category = data.category;
  if (data.amount !== undefined) existing.amount = data.amount;
  if (data.currency !== undefined) existing.currency = data.currency;
  if (data.expenseDate !== undefined) {
    existing.expenseDate = parseDate(data.expenseDate);
  }
  if (data.dueDate !== undefined) {
    existing.dueDate = data.dueDate ? parseDate(data.dueDate) : undefined;
  }
  if (data.status !== undefined) existing.status = data.status;
  if (data.paymentMethod !== undefined) {
    existing.paymentMethod = data.paymentMethod ?? undefined;
  }
  if (data.invoiceNumber !== undefined) {
    existing.invoiceNumber = data.invoiceNumber ?? undefined;
  }
  if (data.notes !== undefined) {
    existing.notes = data.notes ?? undefined;
  }

  await existing.save();

  return serializeExpense(existing);
}

export async function deleteExpense(organizationId: string, expenseId: string) {
  await connectDB();

  if (!Types.ObjectId.isValid(expenseId)) {
    throw new Error("Invalid expense ID.");
  }

  const deleted = await Expense.findOneAndDelete({
    _id: new Types.ObjectId(expenseId),
    organizationId: new Types.ObjectId(organizationId),
  });

  return deleted !== null;
}
