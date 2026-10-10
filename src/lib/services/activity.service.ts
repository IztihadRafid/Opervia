import mongoose from "mongoose";

import Activity from "@/lib/db/models/Activity";

export const activityTypes = [
  "application_added",
  "application_updated",
  "application_deleted",
  "subscription_renewed",
  "user_invited",
  "invitation_revoked",
  "payment_processed",
] as const;

export type ActivityType = (typeof activityTypes)[number];

export interface CreateActivityInput {
  organizationId: string;
  userId: string;
  type: ActivityType;
  title: string;
  description: string;
  entityId?: string;
}

export interface GetActivitiesInput {
  organizationId: string;
  page: number;
  limit: number;
  type?: ActivityType;
}

export async function createActivity(input: CreateActivityInput) {
  if (!mongoose.Types.ObjectId.isValid(input.organizationId)) {
    throw new Error("Invalid activity organization ID");
  }

  if (!mongoose.Types.ObjectId.isValid(input.userId)) {
    throw new Error("Invalid activity actor ID");
  }

  if (
    input.entityId !== undefined &&
    !mongoose.Types.ObjectId.isValid(input.entityId)
  ) {
    throw new Error("Invalid activity entity ID");
  }

  return Activity.create({
    organizationId: new mongoose.Types.ObjectId(input.organizationId),
    userId: new mongoose.Types.ObjectId(input.userId),
    type: input.type,
    title: input.title,
    description: input.description,
    ...(input.entityId
      ? { entityId: new mongoose.Types.ObjectId(input.entityId) }
      : {}),
  });
}

export async function getActivities(input: GetActivitiesInput) {
  if (!mongoose.Types.ObjectId.isValid(input.organizationId)) {
    throw new Error("Invalid activity organization ID");
  }

  const organizationId = new mongoose.Types.ObjectId(input.organizationId);

  const filter = {
    organizationId,
    ...(input.type ? { type: input.type } : {}),
  };

  const skip = (input.page - 1) * input.limit;

  const [activities, total] = await Promise.all([
    Activity.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(input.limit)
      .select("organizationId userId type title description entityId createdAt")
      .lean(),

    Activity.countDocuments(filter),
  ]);

  return {
    activities,
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.ceil(total / input.limit),
    },
  };
}
