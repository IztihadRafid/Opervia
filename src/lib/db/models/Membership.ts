import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IMembership extends Document {
  userId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  role: "owner" | "admin" | "member" | "viewer";
  status: "active" | "invited" | "suspended";
  createdAt: Date;
  updatedAt: Date;
}

const membershipSchema = new Schema<IMembership>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["owner", "admin", "member", "viewer"],
      default: "member",
    },

    status: {
      type: String,
      enum: ["active", "invited", "suspended"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

membershipSchema.index(
  {
    userId: 1,
    organizationId: 1,
  },
  {
    unique: true,
  },
);

membershipSchema.index({
  organizationId: 1,
  status: 1,
});

const Membership: Model<IMembership> =
  mongoose.models.Membership ||
  mongoose.model<IMembership>("Membership", membershipSchema);

export default Membership;
