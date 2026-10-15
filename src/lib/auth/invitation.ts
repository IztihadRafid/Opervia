import crypto from "crypto";
const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const ENCRYPTION_KEY_ENV = "INVITATION_TOKEN_ENCRYPTION_KEY";

function getEncryptionKey(): Buffer {
  const key = process.env[ENCRYPTION_KEY_ENV];

  if (!key) {
    throw new Error(`${ENCRYPTION_KEY_ENV} environment variable is required`);
  }

  const decodedKey = Buffer.from(key, "hex");

  if (!/^[a-fA-F0-9]{64}$/.test(key) || decodedKey.length !== 32) {
    throw new Error(
      `${ENCRYPTION_KEY_ENV} must be a 64-character hexadecimal key`,
    );
  }
  return decodedKey;
}

export function generateInvitationToken() {
  const token = crypto.randomBytes(32).toString("hex");

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  return {
    token,
    tokenHash,
  };
}

export function hashInvitationToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function encryptInvitationToken(token: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    ENCRYPTION_ALGORITHM,
    getEncryptionKey(),
    iv,
  );

  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

export function decryptInvitationToken(encryptedToken: string): string {
  const parts = encryptedToken.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted invitation token");
  }

  const [ivHex, authTagHex, encryptedHex] = parts;

  if (
    !/^[a-fA-F0-9]{24}$/.test(ivHex) ||
    !/^[a-fA-F0-9]{32}$/.test(authTagHex) ||
    !/^(?:[a-fA-F0-9]{2})+$/.test(encryptedHex)
  ) {
    throw new Error("Invalid encrypted invitation token");
  }

  const decipher = crypto.createDecipheriv(
    ENCRYPTION_ALGORITHM,
    getEncryptionKey(),
    Buffer.from(ivHex, "hex"),
  );

  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
