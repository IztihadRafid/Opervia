import mongoose, { Schema, type Document, type Model } from "mongoose";

export type CategoryStatus = "active" | "inactive";

export interface ICategory extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  normalizedName: string;
  status: CategoryStatus;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
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
      maxlength: 100,
    },

    normalizedName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
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

// Keep normalizedName consistent when saving a category document.
categorySchema.pre("validate", function () {
  if (this.name) {
    this.normalizedName = this.name.trim().toLowerCase().replace(/\s+/g, " ");
  }
});

// Prevent duplicate category names within the same organization.
categorySchema.index(
  {
    organizationId: 1,
    normalizedName: 1,
  },
  {
    unique: true,
    name: "organizationId_1_normalizedName_1",
  },
);

categorySchema.index(
  {
    organizationId: 1,
    status: 1,
  },
  {
    name: "organizationId_1_status_1",
  },
);

categorySchema.index(
  {
    organizationId: 1,
    createdAt: -1,
    _id: -1,
  },
  {
    name: "organizationId_1_createdAt_-1__id_-1",
  },
);

const Category: Model<ICategory> =
  mongoose.models.Category ||
  mongoose.model<ICategory>("Category", categorySchema);

export default Category;
