import mongoose, { Schema, type Document, type Model } from "mongoose";

export type ExpenseCategory =
  | "software"
  | "hardware"
  | "cloud_hosting"
  | "marketing"
  | "office"
  | "travel"
  | "professional_services"
  | "other";

export type ExpenseStatus = "paid" | "pending" | "overdue" | "cancelled";

export type ExpensePaymentMethod =
  "credit_card" | "debit_card" | "bank_transfer" | "cash" | "paypal" | "other";

export interface IExpense extends Document {
  organizationId: mongoose.Types.ObjectId;
  vendorId?: mongoose.Types.ObjectId;
  applicationId?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  expenseDate: Date;
  dueDate?: Date;
  status: ExpenseStatus;
  paymentMethod?: ExpensePaymentMethod;
  invoiceNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
    },

    applicationId: {
      type: Schema.Types.ObjectId,
      ref: "Application",
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    category: {
      type: String,
      enum: [
        "software",
        "hardware",
        "cloud_hosting",
        "marketing",
        "office",
        "travel",
        "professional_services",
        "other",
      ],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
      validate: {
        validator: (value: number) => Number.isFinite(value),
        message: "Expense amount must be a finite number.",
      },
    },

    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 3,
      default: "USD",
      match: /^[A-Z]{3}$/,
    },

    expenseDate: {
      type: Date,
      required: true,
    },

    dueDate: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["paid", "pending", "overdue", "cancelled"],
      default: "pending",
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: [
        "credit_card",
        "debit_card",
        "bank_transfer",
        "cash",
        "paypal",
        "other",
      ],
    },

    invoiceNumber: {
      type: String,
      trim: true,
      maxlength: 150,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
  },
);

expenseSchema.index({
  organizationId: 1,
  expenseDate: -1,
  _id: -1,
});

expenseSchema.index({
  organizationId: 1,
  status: 1,
  expenseDate: -1,
});

expenseSchema.index({
  organizationId: 1,
  category: 1,
  expenseDate: -1,
});

expenseSchema.index({
  organizationId: 1,
  vendorId: 1,
});

expenseSchema.index({
  organizationId: 1,
  applicationId: 1,
});

expenseSchema.index({
  organizationId: 1,
  dueDate: 1,
});

const Expense: Model<IExpense> =
  mongoose.models.Expense || mongoose.model<IExpense>("Expense", expenseSchema);

export default Expense;
