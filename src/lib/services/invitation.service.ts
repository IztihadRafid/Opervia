import mongoose from "mongoose";

import Invitation from "@/lib/db/models/Invitation";
import { generateInvitationToken } from "@/lib/auth/invitation";
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
