import mongoose, {
  Schema,
  type Document,
  type Model,
} from "mongoose";

export interface IActivity extends Document {
  organizationId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  type:
    | "application_added"
    | "subscription_renewed"
    | "user_invited"
    | "payment_processed";
  title: string;
  description: string;
  entityId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    type: {
      type: String,
      enum: [
        "application_added",
        "subscription_renewed",
        "user_invited",
        "payment_processed",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    entityId: {
      type: Schema.Types.ObjectId,
    },
  },
  {
    timestamps: true,
  }
);

activitySchema.index({
  organizationId: 1,
  createdAt: -1,
});

activitySchema.index({
  organizationId: 1,
  type: 1,
  createdAt: -1,
});

const Activity: Model<IActivity> =
  mongoose.models.Activity ||
  mongoose.model<IActivity>("Activity", activitySchema);

export default Activity;