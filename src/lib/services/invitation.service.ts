import mongoose from "mongoose";

import Invitation from "@/lib/db/models/Invitation";
import {
  generateInvitationToken,
  hashInvitationToken,
} from "@/lib/auth/invitation";
import { connectDB } from "@/lib/db/mongoose";

const INVITATION_EXPIRATION_DAYS = 7;

export async function createInvitation({
  organizationId,
  email,
  role,
  invitedBy,
}: {
  organizationId: string;
  email: string;
  role: "admin" | "member" | "viewer";
  invitedBy: string;
}) {
  await connectDB();

  if (
    !mongoose.Types.ObjectId.isValid(organizationId) ||
    !mongoose.Types.ObjectId.isValid(invitedBy)
  ) {
    throw new Error("Invalid invitation data");
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existingInvitation = await Invitation.findOne({
    organizationId,
    email: normalizedEmail,
    acceptedAt: null,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });
  if (existingInvitation) {
    throw new Error("An active invitation already exists for this email");
  }

  const { token, tokenHash } = generateInvitationToken();

  const expiresAt = new Date(
    Date.now() + INVITATION_EXPIRATION_DAYS * 24 * 60 * 60 * 1000,
  );

  const invitation = await Invitation.create({
    organizationId,
    email: normalizedEmail,
    role,
    tokenHash,
    expiresAt,
    acceptedAt: null,
    invitedBy,
  });

  return {
    invitation,
    token,
  };
}
export async function getInvitationDetails(token: string) {
  await connectDB();

  if (!token || token.length !== 64) {
    return null;
  }

  const tokenHash = hashInvitationToken(token);

  const invitation = await Invitation.findOne({
    tokenHash,
    acceptedAt: null,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  }).lean();

  if (!invitation) {
    return null;
  }

  return {
    email: invitation.email,
    role: invitation.role,
    expiresAt: invitation.expiresAt,
  };
}
export async function getInvitations({
  organizationId,
  page = 1,
  limit = 25,
}: {
  organizationId: string;
  page?: number;
  limit?: number;
}) {
  await connectDB();

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const skip = (safePage - 1) * safeLimit;

  const filter = {
    organizationId,
    acceptedAt: null,
  };

  const [invitations, total] = await Promise.all([
    Invitation.find(filter)
      .select("email role expiresAt invitedBy createdAt revokedAt")
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),

    Invitation.countDocuments(filter),
  ]);

  const now = new Date();

  const data = invitations.map((invitation) => ({
    _id: invitation._id.toString(),
    email: invitation.email,
    role: invitation.role,
    expiresAt: invitation.expiresAt,
    invitedBy: invitation.invitedBy.toString(),
    createdAt: invitation.createdAt,
    status: invitation.revokedAt
      ? ("revoked" as const)
      : invitation.expiresAt > now
        ? ("pending" as const)
        : ("expired" as const),
  }));

  return {
    data,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}
export async function revokeInvitation({
  organizationId,
  invitationId,
}: {
  organizationId: string;
  invitationId: string;
}) {
  await connectDB();

  if (
    !mongoose.Types.ObjectId.isValid(organizationId) ||
    !mongoose.Types.ObjectId.isValid(invitationId)
  ) {
    throw new Error("Invalid invitation data");
  }

  const invitation = await Invitation.findOneAndUpdate(
    {
      _id: invitationId,
      organizationId,
      acceptedAt: null,
      revokedAt: null,
    },
    {
      $set: {
        revokedAt: new Date(),
      },
    },
    {
      new: true,
    },
  ).lean();

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  return invitation;
}
