import {
  ApplicationListItem,
  ApplicationPagination,
} from "../../../types/application";
import Application from "../db/models/Application";

interface GetApplicationsOptions {
  page?: number;
  limit?: number;
  status?: "active" | "inactive" | "archived";
  search?: string;
}

export async function getApplications(
  organizationId: string,
  options: GetApplicationsOptions = {},
): Promise<{
  applications: ApplicationListItem[];
  pagination: ApplicationPagination;
}> {
  const page = Math.max(options.page ?? 1, 1);
  const limit = Math.min(Math.max(options.limit ?? 25, 1), 100);

  const skip = (page - 1) * limit;

  const filter: {
    organizationId: string;
    status?: "active" | "inactive" | "archived";
    $or?: {
      name?: { $regex: string; $options: string };
      vendor?: { $regex: string; $options: string };
    }[];
  } = {
    organizationId,
  };

  if (options.status) {
    filter.status = options.status;
  }

  if (options.search) {
    const escapedSearch = options.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    filter.$or = [
      {
        name: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
      {
        vendor: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
    ];
  }

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Application.countDocuments(filter),
  ]);
  const formattedApplications: ApplicationListItem[] = applications.map(
    (application) => ({
      _id: application._id.toString(),
      organizationId: application.organizationId.toString(),
      name: application.name,
      vendor: application.vendor,
      category: application.category,
      description: application.description,
      website: application.website,
      status: application.status,
      owner: application.owner,
      usersCount: application.usersCount,
      createdAt: application.createdAt.toISOString(),
      updatedAt: application.updatedAt.toISOString(),
    }),
  );
  return {
    applications: formattedApplications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
export async function getApplicationCount(organizationId: string) {
  return Application.countDocuments({
    organizationId,
  });
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
  },
) {
  const application = await Application.create({
    organizationId,
    ...data,
  });

  return {
    _id: application._id.toString(),
    organizationId: application.organizationId.toString(),
    name: application.name,
    vendor: application.vendor,
    category: application.category,
    description: application.description,
    website: application.website,
    status: application.status,
    owner: application.owner,
    usersCount: application.usersCount,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
  };
}
export async function updateApplication(
  organizationId: string,
  applicationId: string,
  data: {
    name?: string;
    vendor?: string;
    category?: string;
    description?: string;
    website?: string;
    status?: "active" | "inactive" | "archived";
    owner?: string;
    usersCount?: number;
  },
) {
  const application = await Application.findOneAndUpdate(
    {
      _id: applicationId,
      organizationId,
    },
    data,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!application) {
    return null;
  }

  return {
    _id: application._id.toString(),
    organizationId: application.organizationId.toString(),
    name: application.name,
    vendor: application.vendor,
    category: application.category,
    description: application.description,
    website: application.website,
    status: application.status,
    owner: application.owner,
    usersCount: application.usersCount,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
  };
}
export async function deleteApplication(
  organizationId: string,
  applicationId: string,
) {
  const application = await Application.findOneAndDelete({
    _id: applicationId,
    organizationId,
  });

  if (!application) {
    return null;
  }

  return {
    _id: application._id.toString(),
  };
}
