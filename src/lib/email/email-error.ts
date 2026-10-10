export class EmailDeliveryError extends Error {
  invitationId?: string;
  email?: string;
  constructor(
    message = "Email delivery failed",
    details?: {
      invitationId?: string;
      email?: string;
    },
  ) {
    super(message);
    this.name = "EmailDeliveryError";
    this.invitationId = details?.invitationId;
    this.email = details?.email;
  }
}
