import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ILicense extends Document {
  organizationId: mongoose.Types.ObjectId;
  applicationId: mongoose.Types.ObjectId;
  name: string;
  licenseType:
    | "named_user"
    | "concurrent"
    | "site"
    | "device"
    | "subscription"
    | "perpetual";
  totalSeats: number;
  usedSeats: number;
  status: "active" | "expired" | "suspended" | "cancelled";
  startDate: Date;
  expiryDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const licenseSchema = new Schema<ILicense>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: "Application",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },
    licenseType: {
      type: String,
      enum: [
        "named_user",
        "concurrent",
        "site",
        "device",
        "subscription",
        "perpetual",
      ],
      required: true,
    },
    totalSeats: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Total seats must be a whole number.",
      },
    },
    usedSeats: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Used seats must be a whole number.",
      },
    },
    status: {
      type: String,
      enum: ["active", "expired", "suspended", "cancelled"],
      default: "active",
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  },
);

licenseSchema.index({
  organizationId: 1,
  applicationId: 1,
});

licenseSchema.index({
  organizationId: 1,
  status: 1,
});

licenseSchema.index({
  organizationId: 1,
  expiryDate: 1,
});

const License: Model<ILicense> =
  mongoose.models.License || mongoose.model<ILicense>("License", licenseSchema);

export default License;
