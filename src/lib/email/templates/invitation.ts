type InvitationEmailParams = {
  organizationName: string;
  inviterName: string;
  role: "admin" | "member" | "viewer";
  invitationUrl: string;
  expiresAt: Date;
};

function formatRole(role: InvitationEmailParams["role"]) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function formatExpirationDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(date);
}

export function getInvitationEmail({
  organizationName,
  inviterName,
  role,
  invitationUrl,
  expiresAt,
}: InvitationEmailParams) {
  const formattedRole = formatRole(role);
  const formattedExpirationDate = formatExpirationDate(expiresAt);

  return {
    subject: `You're invited to join ${organizationName} on Opervia`,

    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>You're invited to Opervia</title>
        </head>

        <body
          style="
            margin: 0;
            padding: 0;
            background-color: #f5f7fa;
            font-family: Arial, Helvetica, sans-serif;
            color: #111827;
          "
        >
          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
            style="background-color: #f5f7fa; padding: 40px 16px;"
          >
            <tr>
              <td align="center">

                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  style="
                    max-width: 560px;
                    background-color: #ffffff;
                    border-radius: 12px;
                    overflow: hidden;
                  "
                >

                  <tr>
                    <td style="padding: 32px 32px 20px;">
                      <h1
                        style="
                          margin: 0;
                          font-size: 24px;
                          line-height: 32px;
                          color: #111827;
                        "
                      >
                        You're invited to Opervia
                      </h1>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 0 32px 32px;">

                      <p
                        style="
                          margin: 0 0 16px;
                          font-size: 16px;
                          line-height: 26px;
                        "
                      >
                        ${inviterName} has invited you to join
                        <strong>${organizationName}</strong> on Opervia.
                      </p>

                      <p
                        style="
                          margin: 0 0 24px;
                          font-size: 16px;
                          line-height: 26px;
                        "
                      >
                        You'll join as a
                        <strong>${formattedRole}</strong>.
                      </p>

                      <table
                        cellpadding="0"
                        cellspacing="0"
                        border="0"
                        style="margin-bottom: 28px;"
                      >
                        <tr>
                          <td
                            style="
                              background-color: #111827;
                              border-radius: 8px;
                            "
                          >
                            <a
                              href="${invitationUrl}"
                              style="
                                display: inline-block;
                                padding: 13px 22px;
                                color: #ffffff;
                                text-decoration: none;
                                font-size: 15px;
                                font-weight: 600;
                              "
                            >
                              Accept Invitation
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p
                        style="
                          margin: 0 0 8px;
                          font-size: 13px;
                          line-height: 20px;
                          color: #6b7280;
                        "
                      >
                        This invitation expires on
                        ${formattedExpirationDate}.
                      </p>

                      <p
                        style="
                          margin: 20px 0 0;
                          font-size: 13px;
                          line-height: 20px;
                          color: #9ca3af;
                          word-break: break-all;
                        "
                      >
                        If the button doesn't work, copy and paste this URL
                        into your browser:
                        <br />
                        ${invitationUrl}
                      </p>

                    </td>
                  </tr>

                </table>

              </td>
            </tr>
          </table>
        </body>
      </html>
    `,

    text: `
You're invited to join ${organizationName} on Opervia.

${inviterName} has invited you to join ${organizationName} as a ${formattedRole}.

Accept your invitation:
${invitationUrl}

This invitation expires on ${formattedExpirationDate}.
    `.trim(),
  };
}
