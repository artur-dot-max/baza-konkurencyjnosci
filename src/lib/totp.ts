import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import * as OTPAuth from "otpauth";
import bcrypt from "bcryptjs";

const ISSUER = "Baza Konkurencyjności FS";

function encryptionKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required for TOTP encryption");
  return createHash("sha256").update(secret).digest();
}

export function encryptTotpSecret(plain: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptTotpSecret(payload: string) {
  const [ivB64, tagB64, dataB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("Invalid TOTP secret payload");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivB64, "base64url"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function generateTotpSecret() {
  return new OTPAuth.Secret({ size: 20 });
}

export function buildTotp(secret: OTPAuth.Secret | string, label: string) {
  const totpSecret = typeof secret === "string" ? OTPAuth.Secret.fromBase32(secret) : secret;
  return new OTPAuth.TOTP({
    issuer: ISSUER,
    label,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: totpSecret,
  });
}

export function verifyTotpCode(secretBase32: string, token: string, label = "user") {
  const totp = buildTotp(secretBase32, label);
  const delta = totp.validate({ token: token.replace(/\s+/g, ""), window: 1 });
  return delta !== null;
}

export function generateBackupCodes(count = 8) {
  const codes: string[] = [];
  for (let i = 0; i < count; i += 1) {
    codes.push(randomBytes(4).toString("hex").toUpperCase());
  }
  return codes;
}

export async function hashBackupCodes(codes: string[]) {
  return Promise.all(codes.map((code) => bcrypt.hash(code, 10)));
}

export async function consumeBackupCode(hashes: string[], code: string) {
  const normalized = code.replace(/\s+/g, "").toUpperCase();
  for (let i = 0; i < hashes.length; i += 1) {
    if (await bcrypt.compare(normalized, hashes[i])) {
      return hashes.filter((_, index) => index !== i);
    }
  }
  return null;
}

export const totpCodeSchema = {
  regex: /^\d{6}$/,
  message: "Kod musi składać się z 6 cyfr",
};
