import mongoose from "mongoose";
import Organization from "@/lib/db/models/Organization";
import User from "@/lib/db/models/User";
import Invitation from "@/lib/db/models/Invitation";
import { sendInvitationEmail } from "@/lib/email/sendInvitationEmail";
import {
  generateInvitationToken,
  hashInvitationToken,
} from "@/lib/auth/invitation";
import { connectDB } from "@/lib/db/mongoose";
import { EmailDeliveryError } from "@/lib/email/email-error";

const INVITATION_EXPIRATION_DAYS = 7;
const RESEND_COOLDOWN_MS = 60 * 1000;

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
  const existingUser = await User.findOne({
    email: normalizedEmail,
  }).select("_id");

  if (existingUser) {
    throw new Error("A user with this email already exists");
  }
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
    revokedAt: null,
    invitedBy,
    emailStatus: "pending",
    emailSentAt: null,
    emailError: null,
  });

  try {
    const [organization, inviter] = await Promise.all([
      Organization.findById(organizationId).select("name").lean(),
      User.findById(invitedBy).select("name").lean(),
    ]);

    if (!organization) {
      throw new Error("Organization not found");
    }

    if (!inviter) {
      throw new Error("Inviter not found");
    }

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

    const invitationUrl = `${baseUrl}/invite/${token}`;

    await sendInvitationEmail({
      to: normalizedEmail,
      organizationName: organization.name,
      inviterName: inviter.name,
      role,
      invitationUrl,
      expiresAt,
    });

    await Invitation.updateOne(
      {
        _id: invitation._id,
        tokenHash,
      },
      {
        $set: {
          emailStatus: "sent",
          emailSentAt: new Date(),
          emailError: null,
        },
      },
    );
  } catch (error) {
    const emailError =
      error instanceof Error
        ? error.message
        : "Failed to send invitation email";

    await Invitation.updateOne(
      {
        _id: invitation._id,
        tokenHash,
      },
      {
        $set: {
          emailStatus: "failed",
          emailSentAt: null,
          emailError,
        },
      },
    );

    throw new EmailDeliveryError(emailError);
  }

  const updatedInvitation = await Invitation.findOne({
    _id: invitation._id,
    tokenHash,
  }).lean();

  if (!updatedInvitation) {
    throw new Error("Invitation not found");
  }

  return {
    invitation: updatedInvitation,
    token,
  };
}

export async function resendInvitation({
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

  const invitation = await Invitation.findOne({
    _id: invitationId,
    organizationId,
  }).select(
    "email role expiresAt acceptedAt revokedAt invitedBy lastResentAt resendCount",
  );

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  if (invitation.acceptedAt) {
    throw new Error("Invitation has already been accepted");
  }

  if (invitation.revokedAt) {
    throw new Error("Invitation has been revoked");
  }

  const now = new Date();

  if (
    invitation.lastResentAt &&
    now.getTime() - invitation.lastResentAt.getTime() < RESEND_COOLDOWN_MS
  ) {
    throw new Error(
      "Invitation was resent recently. Please wait before resending",
    );
  }

  const { token, tokenHash } = generateInvitationToken();

  const expiresAt = new Date(
    now.getTime() + INVITATION_EXPIRATION_DAYS * 24 * 60 * 60 * 1000,
  );

  const reservedInvitation = await Invitation.findOneAndUpdate(
    {
      _id: invitationId,
      organizationId,
      acceptedAt: null,
      revokedAt: null,
      lastResentAt: invitation.lastResentAt ?? null,
    },
    {
      $set: {
        tokenHash,
        expiresAt,
        lastResentAt: now,
        emailStatus: "pending",
        emailSentAt: null,
        emailError: null,
      },
      $inc: {
        resendCount: 1,
      },
    },
    {
      new: true,
    },
  );

  if (!reservedInvitation) {
    throw new Error("Invitation changed. Please try again");
  }

  try {
    const [organization, inviter] = await Promise.all([
      Organization.findById(organizationId).select("name").lean(),
      User.findById(reservedInvitation.invitedBy).select("name").lean(),
    ]);

    if (!organization) {
      throw new Error("Organization not found");
    }

    if (!inviter) {
      throw new Error("Inviter not found");
    }

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const invitationUrl = `${baseUrl}/invite/${token}`;

    await sendInvitationEmail({
      to: reservedInvitation.email,
      organizationName: organization.name,
      inviterName: inviter.name,
      role: reservedInvitation.role,
      invitationUrl,
      expiresAt,
    });

    await Invitation.updateOne(
      {
        _id: invitationId,
        organizationId,
        tokenHash,
        acceptedAt: null,
        revokedAt: null,
      },
      {
        $set: {
          emailStatus: "sent",
          emailSentAt: new Date(),
          emailError: null,
        },
      },
    );
  } catch (error) {
    const emailError =
      error instanceof Error
        ? error.message
        : "Failed to send invitation email";

    await Invitation.updateOne(
      {
        _id: invitationId,
        organizationId,
        tokenHash,
        acceptedAt: null,
        revokedAt: null,
      },
      {
        $set: {
          emailStatus: "failed",
          emailSentAt: null,
          emailError,
        },
      },
    );

    throw new EmailDeliveryError(emailError);
  }

  const updatedInvitation = await Invitation.findOne({
    _id: invitationId,
    organizationId,
    tokenHash,
  }).lean();

  if (!updatedInvitation) {
    throw new Error("Invitation not found");
  }

  return {
    invitation: updatedInvitation,
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
      .select("email role expiresAt invitedBy createdAt revokedAt emailStatus")
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
    emailStatus: invitation.emailStatus,
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
