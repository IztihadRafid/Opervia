import { resend } from "@/lib/email/client";
import { getInvitationEmail } from "@/lib/email/templates/invitation";

type SendInvitationEmailParams = {
  to: string;
  organizationName: string;
  inviterName: string;
  role: "admin" | "member" | "viewer";
  invitationUrl: string;
  expiresAt: Date;
};

export async function sendInvitationEmail({
  to,
  organizationName,
  inviterName,
  role,
  invitationUrl,
  expiresAt,
}: SendInvitationEmailParams) {
  const { subject, html, text } = getInvitationEmail({
    organizationName,
    inviterName,
    role,
    invitationUrl,
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
