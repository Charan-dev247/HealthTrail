import crypto from "crypto";

// 256-bit random token; only its SHA-256 hash is stored in the database
export function newToken() {
  return crypto.randomBytes(32).toString("base64url");
}
export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}