import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IApplication extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  vendor: string;
  category: string;
  description?: string;
  website?: string;
  status: "active" | "inactive" | "archived";
  owner?: string;
  usersCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<IApplication>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
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

    vendor: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    website: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "archived"],
      default: "active",
      index: true,
    },

    owner: {
      type: String,
      trim: true,
      maxlength: 150,
    },

    usersCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

applicationSchema.index({
  organizationId: 1,
  status: 1,
});

applicationSchema.index({
  organizationId: 1,
  category: 1,
});

const Application: Model<IApplication> =
  mongoose.models.Application ||
  mongoose.model<IApplication>("Application", applicationSchema);

export default Application;