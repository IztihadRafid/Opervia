import mongoose from "mongoose";

import Invitation from "@/lib/db/models/Invitation";
import Membership from "@/lib/db/models/Membership";
import User from "@/lib/db/models/User";
import { hashInvitationToken } from "@/lib/auth/invitation";
import { hashPassword } from "@/lib/auth/password";
import { connectDB } from "@/lib/db/mongoose";

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

  const tokenHash = hashInvitationToken(token);

  const invitation = await Invitation.findOne({
    tokenHash,
    acceptedAt: null,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  }).select("+tokenHash");

  if (!invitation) {
    throw new Error("Invitation is invalid or has expired");
  }

  const existingUser = await User.findOne({
    email: invitation.email,
  });

  if (existingUser) {
    throw new Error("A user with this email already exists");
  }

  const passwordHash = await hashPassword(password);

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const [user] = await User.create(
      [
        {
          organizationId: invitation.organizationId,
          name: name.trim(),
          email: invitation.email,
          passwordHash,
          emailVerifiedAt: new Date(),
          role: invitation.role,
          status: "active",
        },
      ],
      { session },
    );

    await Membership.create(
      [
        {
          userId: user._id,
          organizationId: invitation.organizationId,
          role: invitation.role,
          status: "active",
        },
      ],
      { session },
    );

    invitation.acceptedAt = new Date();
    await invitation.save({ session });

    await session.commitTransaction();

    return {
      userId: user._id.toString(),
      organizationId: invitation.organizationId.toString(),
      role: invitation.role,
      email: invitation.email,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}
