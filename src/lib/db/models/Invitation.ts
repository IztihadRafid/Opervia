import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IInvitation extends Document {
  organizationId: mongoose.Types.ObjectId;
  email: string;
  role: "admin" | "member" | "viewer";
  tokenHash: string;
  expiresAt: Date;
  acceptedAt?: Date | null;
  revokedAt?: Date | null;
  invitedBy: mongoose.Types.ObjectId;
  lastResentAt?: Date | null;
  resendCount: number;
  emailStatus: "pending" | "sent" | "failed";
  emailSentAt?: Date | null;
  emailError?: string | null;

  createdAt: Date;
  updatedAt: Date;
}

const invitationSchema = new Schema<IInvitation>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },

    role: {
      type: String,
      enum: ["admin", "member", "viewer"],
      required: true,
    },

    tokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    acceptedAt: {
      type: Date,
      default: null,
    },
    revokedAt: {
      type: Date,
      default: null,
      index: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastResentAt: {
      type: Date,
      default: null,
    },

    resendCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    emailStatus: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
      index: true,
    },

    emailSentAt: {
      type: Date,
      default: null,
    },

    emailError: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

invitationSchema.index({
  organizationId: 1,
  email: 1,
  acceptedAt: 1,
});

const Invitation: Model<IInvitation> =
  mongoose.models.Invitation ||
  mongoose.model<IInvitation>("Invitation", invitationSchema);

export default Invitation;
