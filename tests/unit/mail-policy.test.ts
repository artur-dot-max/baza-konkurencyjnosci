import test from "node:test";
import assert from "node:assert/strict";
import { MAX_MAIL_ATTEMPTS, mailRetryDelayMs, safeMailError } from "../../src/lib/mail-policy";

test("mail retry policy backs off and caps at one hour", () => {
  assert.equal(mailRetryDelayMs(1), 60_000);
  assert.equal(mailRetryDelayMs(2), 120_000);
  assert.equal(mailRetryDelayMs(MAX_MAIL_ATTEMPTS), 3_600_000);
});

test("mail errors are bounded and single-line", () => {
  assert.equal(safeMailError(new Error("SMTP\r\nsecret-safe-message")), "SMTP secret-safe-message");
  assert.equal(safeMailError(new Error("x".repeat(2000))).length, 1000);
});
