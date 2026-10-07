import PasswordResetToken from "@/lib/db/models/PasswordResetToken";
import User from "@/lib/db/models/User";

import {
  generatePasswordResetToken,
  hashPasswordResetToken,
} from "@/lib/auth/passwordReset";
import { hashPassword } from "@/lib/auth/password";
import { connectDB } from "@/lib/db/mongoose";
import { sendPasswordResetEmail } from "@/lib/email/sendPasswordResetEmail";
import { passwordSchema } from "@/lib/validations/password";

const PASSWORD_RESET_EXPIRATION_MINUTES = 30;

export async function requestPasswordReset(email: string) {
  await connectDB();

  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
    status: "active",
  }).select("_id email name");

  if (!user) {
    return {
      success: true,
    };
  }

  /*Invalidate any previous unused reset tokens for this user.*/
  await PasswordResetToken.updateMany(
    {
      userId: user._id,
      usedAt: null,
    },
    {
      $set: {
        usedAt: new Date(),
      },
    },
  );

  const { token, tokenHash } = generatePasswordResetToken();

  const expiresAt = new Date(
    Date.now() + PASSWORD_RESET_EXPIRATION_MINUTES * 60 * 1000,
  );

  await PasswordResetToken.create({
    userId: user._id,
    tokenHash,
    expiresAt,
    usedAt: null,
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  try {
    await sendPasswordResetEmail({
      to: user.email,
      userName: user.name,
      resetUrl,
      expiresAt,
    });
  } catch {
    await PasswordResetToken.updateOne(
      {
        tokenHash,
        usedAt: null,
      },
      {
        $set: {
          usedAt: new Date(),
        },
      },
    );

    throw new Error("Password reset email could not be sent");
  }

  return {
    success: true,
  };
}

export async function resetPassword({
  token,
  password,
}: {
  token: string;
  password: string;
}) {
  await connectDB();

  if (!token || token.length !== 64) {
    throw new Error("Invalid or expired password reset token");
  }

  const parsedPassword = passwordSchema.safeParse(password);

  if (!parsedPassword.success) {
    throw new Error(
      parsedPassword.error.issues[0]?.message ?? "Invalid password",
    );
  }

  const tokenHash = hashPasswordResetToken(token);

  const resetToken = await PasswordResetToken.findOne({
    tokenHash,
    usedAt: null,
    expiresAt: {
      $gt: new Date(),
    },
  }).select("+tokenHash");

  if (!resetToken) {
    throw new Error("Invalid or expired password reset token");
  }

  const user = await User.findById(resetToken.userId).select("+passwordHash");

  if (!user || user.status !== "active") {
    throw new Error("Invalid or expired password reset token");
  }

  const passwordHash = await hashPassword(parsedPassword.data);

  user.passwordHash = passwordHash;
  user.sessionVersion = (user.sessionVersion ?? 1) + 1;

  await user.save();

  resetToken.usedAt = new Date();

  await resetToken.save();

  /* Invalidate any other unused reset tokens belonging to this user. */
  await PasswordResetToken.updateMany(
    {
      userId: user._id,
      usedAt: null,
      _id: {
        $ne: resetToken._id,
      },
    },
    {
      $set: {
        usedAt: new Date(),
      },
    },
  );

  return {
    success: true,
  };
}
