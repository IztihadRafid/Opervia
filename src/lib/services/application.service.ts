import Application from "../db/models/Application";

interface GetApplicationsOptions {
  page?: number;
  limit?: number;
}

export async function getApplications(
  organizationId: string,
  options: GetApplicationsOptions = {}
) {
  const page = Math.max(options.page ?? 1, 1);
  const limit = Math.min(Math.max(options.limit ?? 25, 1), 100);

  const skip = (page - 1) * limit;

  const filter = {
    organizationId,
  };

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Application.countDocuments(filter),
  ]);

  return {
    applications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
export async function createApplication(
  organizationId: string,
  data: {
    name: string;
    vendor: string;
    category: string;
    description?: string;
    website?: string;
    status?: "active" | "inactive" | "archived";
    owner?: string;
    usersCount?: number;
  }
) {
  const application = await Application.create({
    organizationId,
    ...data,
  });

  return application;
}