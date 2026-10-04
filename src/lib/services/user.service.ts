import User from "@/lib/db/models/User";

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
  const page = Math.max(options.page ?? 1, 1);
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {
    organizationId,
  };

  if (options.status) {
    filter.status = options.status;
  }
  if (options.role) {
    filter.role = options.role;
  }
  if (options.search?.trim()) {
    const search = options.search.trim();

    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    User.countDocuments(filter),
  ]);

  return {
    data: users.map((user) => ({
      ...user,
      _id: user._id.toString(),
      organizationId: user.organizationId.toString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
export async function createUser(
  organizationId: string,
  data: {
    name: string;
    email: string;
    role?: "owner" | "admin" | "member" | "viewer";
    status?: "active" | "invited" | "suspended";
  },
) {
  const existingUser = await User.findOne({
    organizationId,
    email: data.email,
  });

  if (existingUser) {
    throw new Error("A user with this email already exists");
  }

  const user = await User.create({
    organizationId,
    name: data.name,
    email: data.email,
    role: data.role ?? "member",
    status: data.status ?? "active",
  });

  return {
    ...user.toObject(),
    _id: user._id.toString(),
    organizationId: user.organizationId.toString(),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
