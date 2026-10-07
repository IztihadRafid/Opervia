import { resend } from "@/lib/email/client";

import { getPasswordResetEmail } from "@/lib/email/templates/passwordReset";

type SendPasswordResetEmailParams = {
  to: string;
  userName: string;
  resetUrl: string;
  expiresAt: Date;
};

export async function sendPasswordResetEmail({
  to,
  userName,
  resetUrl,
  expiresAt,
}: SendPasswordResetEmailParams) {
  const { subject, html, text } = getPasswordResetEmail({
    userName,
    resetUrl,
    expiresAt,
  });

  const from = process.env.EMAIL_FROM;

  if (!from) {
    throw new Error("EMAIL_FROM is not configured");
  }

  const result = await resend.emails.send({
    from,
    to,
    subject,
    html,
    text,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}
