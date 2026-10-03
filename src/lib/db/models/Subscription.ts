import mongoose, {
  Schema,
  type Document,
  type Model,
} from "mongoose";

export interface ISubscription extends Document {
  organizationId: mongoose.Types.ObjectId;
  applicationId: mongoose.Types.ObjectId;
  plan: string;
  billingCycle: "monthly" | "quarterly" | "yearly";
  amount: number;
  currency: string;
  renewalDate: Date;
  status: "active" | "cancelled" | "expired" | "paused";
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
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

    plan: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    billingCycle: {
      type: String,
      enum: ["monthly", "quarterly", "yearly"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 3,
      default: "USD",
    },

    renewalDate: {
      type: Date,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["active", "cancelled", "expired", "paused"],
      default: "active",
      index: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

subscriptionSchema.index({
  organizationId: 1,
  renewalDate: 1,
});

subscriptionSchema.index({
  organizationId: 1,
  status: 1,
});

const Subscription: Model<ISubscription> =
  mongoose.models.Subscription ||
  mongoose.model<ISubscription>("Subscription", subscriptionSchema);

export default Subscription;