import { auth } from "@/auth";
import { getMembership } from "@/lib/services/membership.service";

const roleHierarchy = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4,
} as const;

export type OrganizationRole = keyof typeof roleHierarchy;

export class UnauthorizedError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "You do not have access to this organization") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function requireOrganizationMembership(
  organizationId: string,
  minimumRole?: OrganizationRole,
) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  const membership = await getMembership(session.user.id, organizationId);

  if (!membership) {
    throw new ForbiddenError();
  }

  if (
    minimumRole &&
    roleHierarchy[membership.role as OrganizationRole] <
      roleHierarchy[minimumRole]
  ) {
    throw new ForbiddenError();
  }

  return {
    userId: session.user.id,
    organizationId,
    role: membership.role,
    membership,
  };
}
