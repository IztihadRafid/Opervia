import { z } from "zod";

const expenseCategories = [
  "software",
  "hardware",
  "cloud_hosting",
  "marketing",
  "office",
  "travel",
  "professional_services",
  "other",
] as const;

const expenseStatuses = ["paid", "pending", "overdue", "cancelled"] as const;

const expensePaymentMethods = [
  "credit_card",
  "debit_card",
  "bank_transfer",
  "cash",
  "paypal",
  "other",
] as const;

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID.");

const dateSchema = z
  .string()
  .trim()
  .min(1, "Date is required.")
  .refine(
    (value) =>
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)) &&
      new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value,
    "Enter a valid date.",
  );

const optionalDateSchema = dateSchema.nullable().optional();

const optionalTextSchema = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength, `Must be ${maxLength} characters or fewer.`)
    .nullable()
    .optional();

const expenseFields = {
  vendorId: objectIdSchema.nullable().optional(),
  applicationId: objectIdSchema.nullable().optional(),

  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters.")
    .max(150, "Title must be 150 characters or fewer."),

  description: optionalTextSchema(2000),

  category: z.enum(expenseCategories),

  amount: z
    .number()
    .finite("Amount must be a finite number.")
    .positive("Amount must be greater than zero.")
    .max(1_000_000_000_000, "Amount is too large."),

  currency: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{3}$/, "Currency must be a 3-letter code.")
    .transform((value) => value.toUpperCase())
    .default("USD"),

  expenseDate: dateSchema,

  dueDate: optionalDateSchema,

  status: z.enum(expenseStatuses).default("pending"),

  paymentMethod: z.enum(expensePaymentMethods).nullable().optional(),

  invoiceNumber: optionalTextSchema(150),

  notes: optionalTextSchema(2000),
};

function validateExpenseDates(
  data: {
    expenseDate?: string;
    dueDate?: string | null;
  },
  ctx: z.RefinementCtx,
) {
  if (data.expenseDate && data.dueDate && data.dueDate < data.expenseDate) {
    ctx.addIssue({
      code: "custom",
      path: ["dueDate"],
      message: "Due date cannot be before the expense date.",
    });
  }
}

export const createExpenseSchema = z
  .object(expenseFields)
  .superRefine(validateExpenseDates);

export const updateExpenseSchema = z
  .object({
    vendorId: expenseFields.vendorId,
    applicationId: expenseFields.applicationId,
    title: expenseFields.title.optional(),
    description: expenseFields.description,
    category: expenseFields.category.optional(),
    amount: expenseFields.amount.optional(),
    currency: expenseFields.currency.optional(),
    expenseDate: expenseFields.expenseDate.optional(),
    dueDate: expenseFields.dueDate,
    status: expenseFields.status.optional(),
    paymentMethod: expenseFields.paymentMethod,
    invoiceNumber: expenseFields.invoiceNumber,
    notes: expenseFields.notes,
  })
  .superRefine(validateExpenseDates);

export type CreateExpenseInput = z.input<typeof createExpenseSchema>;
export type ParsedCreateExpenseInput = z.output<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.input<typeof updateExpenseSchema>;
export type ParsedUpdateExpenseInput = z.output<typeof updateExpenseSchema>;
