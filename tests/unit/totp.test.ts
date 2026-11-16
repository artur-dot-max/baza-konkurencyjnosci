import test from "node:test";
import assert from "node:assert/strict";
import {
  buildTotp,
  encryptTotpSecret,
  decryptTotpSecret,
  generateBackupCodes,
  generateTotpSecret,
  hashBackupCodes,
  consumeBackupCode,
  verifyTotpCode,
} from "../../src/lib/totp";

test("totp secret encrypt/decrypt roundtrip", () => {
  process.env.AUTH_SECRET = process.env.AUTH_SECRET || "test-secret-for-unit-tests-only";
  const secret = generateTotpSecret().base32;
  const encrypted = encryptTotpSecret(secret);
  assert.notEqual(encrypted, secret);
  assert.equal(decryptTotpSecret(encrypted), secret);
});

test("totp code verifies for current window", () => {
  process.env.AUTH_SECRET = process.env.AUTH_SECRET || "test-secret-for-unit-tests-only";
  const secret = generateTotpSecret();
  const totp = buildTotp(secret, "test@example.com");
  const token = totp.generate();
  assert.equal(verifyTotpCode(secret.base32, token, "test@example.com"), true);
  assert.equal(verifyTotpCode(secret.base32, "000000", "test@example.com"), false);
});

test("backup codes are single-use", async () => {
  const codes = generateBackupCodes(2);
  const hashes = await hashBackupCodes(codes);
  const remaining = await consumeBackupCode(hashes, codes[0]);
  assert.ok(remaining);
  assert.equal(remaining.length, 1);
  const again = await consumeBackupCode(remaining, codes[0]);
  assert.equal(again, null);
});
