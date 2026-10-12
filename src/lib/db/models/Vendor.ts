import mongoose, { Schema, type Document, type Model } from "mongoose";

export type VendorStatus = "active" | "inactive";

export interface IVendor extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  normalizedName: string;
  website?: string;
  contactName?: string;
  contactEmail?: string;
  phone?: string;
  notes?: string;
  status: VendorStatus;
  createdAt: Date;
  updatedAt: Date;
}

const vendorSchema = new Schema<IVendor>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },

    normalizedName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    website: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    contactName: {
      type: String,
      trim: true,
      maxlength: 150,
    },

    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 50,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Keep the normalized name consistent when saving a vendor document.
// Service-level create/update operations must also set normalizedName.
vendorSchema.pre("validate", function () {
  if (this.name) {
    this.normalizedName = this.name.trim().toLowerCase().replace(/\s+/g, " ");
  }
});

// Prevent duplicate vendor names within the same organization.
// Different organizations can have vendors with the same name.
vendorSchema.index(
  {
    organizationId: 1,
    normalizedName: 1,
  },
  {
    unique: true,
    name: "organizationId_1_normalizedName_1",
  },
);

vendorSchema.index(
  {
    organizationId: 1,
    status: 1,
  },
  {
    name: "organizationId_1_status_1",
  },
);

vendorSchema.index(
  {
    organizationId: 1,
    createdAt: -1,
    _id: -1,
  },
  {
    name: "organizationId_1_createdAt_-1__id_-1",
  },
);

const Vendor: Model<IVendor> =
  mongoose.models.Vendor || mongoose.model<IVendor>("Vendor", vendorSchema);

export default Vendor;
