import mongoose from "mongoose";
import { connectDB } from "../db/mongoose";
import Membership from "../db/models/Membership";
import "@/lib/db/models/Organization";
import User from "../db/models/User";

interface GetOrganizationMembershipsOptions {
  page: number;
  limit: number;
  status?: "active" | "invited" | "suspended";
  role?: "owner" | "admin" | "member" | "viewer";
  search?: string;
}

export async function getMembership(userId: string, organizationId: string) {
  await connectDB();

  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(organizationId)
  ) {
    return null;
  }

  return Membership.findOne({
    userId,
    organizationId,
    status: "active",
  })
    .populate("organizationId", "name slug")
    .lean();
}

export async function getMembershipsForUser(userId: string) {
  await connectDB();

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return [];
  }

  return Membership.find({
    userId,
    status: "active",
  })
    .populate("organizationId", "name slug")
    .sort({ createdAt: 1, _id: 1 })
    .lean();
}

export async function getMembershipForUserInOrganization(
  userId: string,
  organizationId: string,
) {
  await connectDB();

  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(organizationId)
  ) {
    return null;
  }

  return Membership.findOne({
    userId,
    organizationId,
  }).lean();
}

export async function getMembershipsForOrganization(
  organizationId: string,
  options: GetOrganizationMembershipsOptions,
) {
  await connectDB();

  if (!mongoose.Types.ObjectId.isValid(organizationId)) {
    throw new Error("Invalid organization ID");
  }

  const page = Math.max(Math.floor(options.page || 1), 1);
  const limit = Math.min(Math.max(Math.floor(options.limit || 20), 1), 100);
  const skip = (page - 1) * limit;

  const membershipFilter: Record<string, unknown> = {
    organizationId: new mongoose.Types.ObjectId(organizationId),
  };

  if (options.status) {
    membershipFilter.status = options.status;
  }

  if (options.role) {
    membershipFilter.role = options.role;
  }

  const pipeline: mongoose.PipelineStage[] = [
    { $match: membershipFilter },
    {
      $lookup: {
        from: User.collection.name,
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
  ];

  const search = options.search?.trim();

  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    pipeline.push({
      $match: {
        $or: [
          { "user.name": { $regex: escapedSearch, $options: "i" } },
          { "user.email": { $regex: escapedSearch, $options: "i" } },
        ],
      },
    });
  }

  const [result] = await Membership.aggregate([
    ...pipeline,
    {
      $facet: {
        data: [
          { $sort: { createdAt: -1, _id: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: "$user._id",
              organizationId: 1,
              name: "$user.name",
              email: "$user.email",
              role: 1,
              status: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
        count: [{ $count: "total" }],
      },
    },
  ]);

  const data = result?.data ?? [];
  const total = result?.count?.[0]?.total ?? 0;

  return {
    data: data.map(
      (membership: {
        _id: mongoose.Types.ObjectId;
        organizationId: mongoose.Types.ObjectId;
        name: string;
        email: string;
        role: "owner" | "admin" | "member" | "viewer";
        status: "active" | "invited" | "suspended";
        createdAt: Date;
        updatedAt: Date;
      }) => ({
        ...membership,
        _id: membership._id.toString(),
        organizationId: membership.organizationId.toString(),
        createdAt: membership.createdAt.toISOString(),
        updatedAt: membership.updatedAt.toISOString(),
      }),
    ),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
  };
}
