type PasswordResetEmailParams = {
  userName: string;
  resetUrl: string;
  expiresAt: Date;
};

function formatExpirationDate(expiresAt: Date) {
  return expiresAt.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });
}

export function getPasswordResetEmail({
  userName,
  resetUrl,
  expiresAt,
}: PasswordResetEmailParams) {
  const expirationText = formatExpirationDate(expiresAt);

  const subject = "Reset your Opervia password";

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${subject}</title>
      </head>

      <body
        style="
          margin: 0;
          padding: 0;
          background-color: #f4f4f5;
          font-family: Arial, Helvetica, sans-serif;
          color: #18181b;
        "
      >
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="background-color: #f4f4f5; padding: 40px 16px;"
        >
          <tr>
            <td align="center">
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  max-width: 560px;
                  background-color: #ffffff;
                  border-radius: 16px;
                  overflow: hidden;
                  border: 1px solid #e4e4e7;
                "
              >
                <tr>
                  <td style="padding: 32px 32px 20px;">
                    <div
                      style="
                        font-size: 24px;
                        font-weight: 700;
                        letter-spacing: -0.5px;
                        color: #18181b;
                      "
                    >
                      Opervia
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 12px 32px 32px;">
                    <h1
                      style="
                        margin: 0 0 16px;
                        font-size: 28px;
                        line-height: 1.25;
                        font-weight: 700;
                        color: #18181b;
                      "
                    >
                      Reset your password
                    </h1>

                    <p
                      style="
                        margin: 0 0 16px;
                        font-size: 16px;
                        line-height: 1.6;
                        color: #52525b;
                      "
                    >
                      Hi ${userName},
                    </p>

                    <p
                      style="
                        margin: 0 0 24px;
                        font-size: 16px;
                        line-height: 1.6;
                        color: #52525b;
                      "
                    >
                      We received a request to reset your Opervia password.
                      Click the button below to create a new password.
                    </p>

                    <table
                      role="presentation"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                    >
                      <tr>
                        <td
                          style="
                            border-radius: 10px;
                            background-color: #18181b;
                          "
                        >
                          <a
                            href="${resetUrl}"
                            target="_blank"
                            style="
                              display: inline-block;
                              padding: 13px 22px;
                              font-size: 15px;
                              font-weight: 600;
                              line-height: 1;
                              color: #ffffff;
                              text-decoration: none;
                              border-radius: 10px;
                            "
                          >
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p
                      style="
                        margin: 24px 0 8px;
                        font-size: 14px;
                        line-height: 1.6;
                        color: #71717a;
                      "
                    >
                      This password reset link expires on:
                    </p>

                    <p
                      style="
                        margin: 0 0 24px;
                        font-size: 14px;
                        line-height: 1.6;
                        font-weight: 600;
                        color: #3f3f46;
                      "
                    >
                      ${expirationText} UTC
                    </p>

                    <p
                      style="
                        margin: 0 0 12px;
                        font-size: 14px;
                        line-height: 1.6;
                        color: #71717a;
                      "
                    >
                      If you didn't request a password reset, you can safely
                      ignore this email. Your password will remain unchanged.
                    </p>

                    <p
                      style="
                        margin: 0;
                        font-size: 14px;
                        line-height: 1.6;
                        color: #71717a;
                      "
                    >
                      For security, never share this link with anyone.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding: 20px 32px 28px;
                      border-top: 1px solid #e4e4e7;
                    "
                  >
                    <p
                      style="
                        margin: 0;
                        font-size: 12px;
                        line-height: 1.5;
                        color: #a1a1aa;
                      "
                    >
                      This is an automated message from Opervia. Please do not
                      reply to this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const text = `
Opervia

Reset your password

Hi ${userName},

We received a request to reset your Opervia password.

Use the following link to create a new password:

${resetUrl}

This password reset link expires on:
${expirationText} UTC

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

For security, never share this link with anyone.

This is an automated message from Opervia.
  `.trim();

  return {
    subject,
    html,
    text,
  };
}
