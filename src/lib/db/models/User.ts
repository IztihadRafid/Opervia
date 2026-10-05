import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IUser extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash?: string;
  emailVerifiedAt?: Date | null;
  lastLoginAt?: Date | null;
  role: "owner" | "admin" | "member" | "viewer";
  status: "active" | "invited" | "suspended";
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
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
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: {
      type: String,
      select: false,
    },

    emailVerifiedAt: {
      type: Date,
      default: null,
    },

    lastLoginAt: {
      type: Date,
      default: null,
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

userSchema.index(
  {
    email: 1,
  },
  {
    unique: true,
  },
);

userSchema.index({
  organizationId: 1,
  status: 1,
});

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
