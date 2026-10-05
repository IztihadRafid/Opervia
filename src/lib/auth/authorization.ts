import { getMembership } from "../services/membership.service";

const roleHierarchy = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4,
} as const;

export type OrganizationRole = keyof typeof roleHierarchy;

export async function requireRole(
  userId: string,
  organizationId: string,
  minimumRole: OrganizationRole,
) {
  const membership = await getMembership(userId, organizationId);

  if (!membership) {
    throw new Error("Forbidden");
  }

  const currentRole = membership.role as OrganizationRole;

  if (roleHierarchy[currentRole] < roleHierarchy[minimumRole]) {
    throw new Error("Forbidden");
  }

  return membership;
}
