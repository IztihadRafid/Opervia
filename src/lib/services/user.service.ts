import mongoose from "mongoose";
import User from "@/lib/db/models/User";
import Membership from "@/lib/db/models/Membership";

interface GetUsersOptions {
  page?: number;
  limit?: number;
  status?: "active" | "invited" | "suspended";
  search?: string;
  role?: "owner" | "admin" | "member" | "viewer";
}

export async function getUsers(
  organizationId: string,
  options: GetUsersOptions = {},
) {
  if (!mongoose.Types.ObjectId.isValid(organizationId)) {
    throw new Error("Invalid organization ID");
  }

  const organizationObjectId = new mongoose.Types.ObjectId(organizationId);
  const page = Math.max(Math.floor(options.page ?? 1), 1);
  const limit = Math.min(Math.max(Math.floor(options.limit ?? 20), 1), 100);
  const skip = (page - 1) * limit;

  const membershipFilter: Record<string, unknown> = {
    organizationId: organizationObjectId,
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

  if (options.search?.trim()) {
    const escapedSearch = options.search
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

  const users = result?.data ?? [];
  const total = result?.count?.[0]?.total ?? 0;

  return {
    data: users.map(
      (user: {
        _id: mongoose.Types.ObjectId;
        organizationId: mongoose.Types.ObjectId;
        name: string;
        email: string;
        role: "owner" | "admin" | "member" | "viewer";
        status: "active" | "invited" | "suspended";
        createdAt: Date;
        updatedAt: Date;
      }) => ({
        ...user,
        _id: user._id.toString(),
        organizationId: user.organizationId.toString(),
        createdAt: user.createdAt.toISOString(),
        updatedAt: (user.updatedAt ?? user.createdAt).toISOString(),
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

export async function getUserById(organizationId: string, userId: string) {
  if (
    !mongoose.Types.ObjectId.isValid(organizationId) ||
    !mongoose.Types.ObjectId.isValid(userId)
  ) {
    return null;
  }

  const membership = await Membership.findOne({
    organizationId,
    userId,
  })
    .select("userId role status")
    .lean();

  if (!membership) {
    return null;
  }

  return {
    _id: membership.userId.toString(),
    role: membership.role,
    status: membership.status,
  };
}

export async function updateUser(
  organizationId: string,
  userId: string,
  data: {
    name?: string;
    email?: string;
    role?: "owner" | "admin" | "member" | "viewer";
    status?: "active" | "invited" | "suspended";
  },
) {
  if (
    !mongoose.Types.ObjectId.isValid(organizationId) ||
    !mongoose.Types.ObjectId.isValid(userId)
  ) {
    return null;
  }

  const session = await User.startSession();
  let updatedUserResult: Record<string, unknown> | null = null;

  try {
    await session.withTransaction(async () => {
      const membership = await Membership.findOne({
        organizationId,
        userId,
      }).session(session);

      if (!membership) {
        updatedUserResult = null;
        return;
      }

      if (data.role === "owner" && membership.role !== "owner") {
        throw new Error(
          "Cannot assign the owner role; ownership transfer is not supported",
        );
      }

      if (
        membership.role === "owner" &&
        membership.status === "active" &&
        ((data.role !== undefined && data.role !== "owner") ||
          (data.status !== undefined && data.status !== "active"))
      ) {
        const activeOwnerCount = await Membership.countDocuments({
          organizationId,
          role: "owner",
          status: "active",
        }).session(session);

        if (activeOwnerCount <= 1) {
          throw new Error(
            "Cannot demote or suspend the last owner of an organization",
          );
        }
      }

      const userUpdates: { name?: string; email?: string } = {};

      if (data.name !== undefined) {
        userUpdates.name = data.name.trim();
      }

      if (data.email !== undefined) {
        const email = data.email.trim().toLowerCase();

        const existingUser = await User.findOne({
          email,
          _id: { $ne: new mongoose.Types.ObjectId(userId) },
        }).session(session);

        if (existingUser) {
          throw new Error("A user with this email already exists");
        }

        userUpdates.email = email;
      }

      const membershipUpdates: {
        role?: "owner" | "admin" | "member" | "viewer";
        status?: "active" | "invited" | "suspended";
      } = {};

      if (data.role !== undefined) {
        membershipUpdates.role = data.role;
      }

      if (data.status !== undefined) {
        membershipUpdates.status = data.status;
      }

      if (Object.keys(userUpdates).length > 0) {
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          { $set: userUpdates },
          { new: true, runValidators: true, session },
        );

        if (!updatedUser) {
          throw new Error("User not found");
        }
      }

      if (Object.keys(membershipUpdates).length > 0) {
        const updatedMembership = await Membership.findOneAndUpdate(
          { organizationId, userId },
          { $set: membershipUpdates },
          { new: true, runValidators: true, session },
        );

        if (!updatedMembership) {
          throw new Error("Organization membership not found");
        }
      }

      const user = await User.findById(userId).session(session).lean();

      const finalMembership = await Membership.findOne({
        organizationId,
        userId,
      })
        .session(session)
        .lean();

      if (!user || !finalMembership) {
        throw new Error("Failed to retrieve the updated user");
      }

      updatedUserResult = {
        ...user,
        _id: user._id.toString(),
        organizationId,
        role: finalMembership.role,
        status: finalMembership.status,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      };
    });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new Error("A user with this email already exists");
    }

    throw error;
  } finally {
    await session.endSession();
  }

  return updatedUserResult;
}

export async function deleteUser(organizationId: string, userId: string) {
  if (
    !mongoose.Types.ObjectId.isValid(organizationId) ||
    !mongoose.Types.ObjectId.isValid(userId)
  ) {
    return null;
  }

  const session = await Membership.startSession();

  try {
    let deletedUser: {
      _id: string;
      organizationId: string;
    } | null = null;

    await session.withTransaction(async () => {
      const membership = await Membership.findOne({
        organizationId,
        userId,
      }).session(session);

      if (!membership) {
        deletedUser = null;
        return;
      }

      if (membership.role === "owner" && membership.status === "active") {
        const activeOwnerCount = await Membership.countDocuments({
          organizationId,
          role: "owner",
          status: "active",
        }).session(session);

        if (activeOwnerCount <= 1) {
          throw new Error("Cannot delete the last owner of an organization");
        }
      }

      await Membership.deleteOne({ _id: membership._id }, { session });

      deletedUser = {
        _id: userId,
        organizationId,
      };
    });

    return deletedUser;
  } finally {
    await session.endSession();
  }
}
