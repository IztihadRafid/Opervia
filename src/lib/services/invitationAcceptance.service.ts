import mongoose from "mongoose";

import Invitation from "@/lib/db/models/Invitation";
import Membership from "@/lib/db/models/Membership";
import User from "@/lib/db/models/User";

import { hashInvitationToken } from "@/lib/auth/invitation";
import { hashPassword } from "@/lib/auth/password";
import { connectDB } from "@/lib/db/mongoose";
import { passwordSchema } from "@/lib/validations/password";

export async function acceptInvitation({
  token,
  name,
  password,
}: {
  token: string;
  name: string;
  password: string;
}) {
  await connectDB();

  if (!token || token.length !== 64) {
    throw new Error("Invalid invitation token");
  }

  const parsedPassword = passwordSchema.safeParse(password);

  if (!parsedPassword.success) {
    throw new Error(
      parsedPassword.error.issues[0]?.message ?? "Invalid password",
    );
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 2 || trimmedName.length > 100) {
    throw new Error("Invalid name");
  }

  const tokenHash = hashInvitationToken(token);

  const invitation = await Invitation.findOne({
    tokenHash,
    acceptedAt: null,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  })
    .select("+tokenHash")
    .lean();

  if (!invitation) {
    throw new Error("Invitation is invalid or has expired");
  }

  const existingUser = await User.findOne({
    email: invitation.email,
  })
    .select("_id")
    .lean();

  if (existingUser) {
    throw new Error("A user with this email already exists");
  }

  const passwordHash = await hashPassword(parsedPassword.data);
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const now = new Date();

    // Claim the invitation inside the transaction.
    // Only an invitation that is still eligible can be accepted.
    const claimedInvitation = await Invitation.findOneAndUpdate(
      {
        _id: invitation._id,
        tokenHash,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { $gt: now },
      },
      {
        $set: {
          acceptedAt: now,
        },
      },
      {
        new: true,
        session,
      },
    );

    if (!claimedInvitation) {
      throw new Error("Invitation is invalid, expired, or already used");
    }

    const [user] = await User.create(
      [
        {
          organizationId: claimedInvitation.organizationId,
          name: trimmedName,
          email: claimedInvitation.email,
          passwordHash,
          emailVerifiedAt: now,
          role: claimedInvitation.role,
          status: "active",
        },
      ],
      { session },
    );

    await Membership.create(
      [
        {
          userId: user._id,
          organizationId: claimedInvitation.organizationId,
          role: claimedInvitation.role,
          status: "active",
        },
      ],
      { session },
    );

    await session.commitTransaction();

    return {
      userId: user._id.toString(),
      organizationId: claimedInvitation.organizationId.toString(),
      role: claimedInvitation.role,
      email: claimedInvitation.email,
    };
  } catch (error: unknown) {
    await session.abortTransaction();

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
}
