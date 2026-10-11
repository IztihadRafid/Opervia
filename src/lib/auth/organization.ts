import mongoose from "mongoose";
import { auth } from "@/auth";
import { headers } from "next/headers";
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
  minimumRole?: OrganizationRole,
) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  const requestHeaders = await headers();
  const selectedOrganizationId = requestHeaders.get("x-organization-id");

  if (
    !selectedOrganizationId ||
    !mongoose.Types.ObjectId.isValid(selectedOrganizationId)
  ) {
    throw new ForbiddenError("A valid organization selection is required");
  }

  const membership = await getMembership(
    session.user.id,
    selectedOrganizationId,
  );

  if (!membership) {
    throw new ForbiddenError();
  }

  const userRole = membership.role as OrganizationRole;

  if (
    !(userRole in roleHierarchy) ||
    (minimumRole !== undefined &&
      roleHierarchy[userRole] < roleHierarchy[minimumRole])
  ) {
    throw new ForbiddenError();
  }

  return {
    userId: session.user.id,
    organizationId: selectedOrganizationId,
    role: membership.role,
    membership,
  };
}
