import test from "node:test";
import assert from "node:assert/strict";
import { isExpiredUnassignedUpload } from "../../src/lib/upload-cleanup";

test("orphan cleanup waits for token expiry and a safety grace period", () => {
  const now = new Date("2026-11-17T12:00:00.000Z");
  assert.equal(isExpiredUnassignedUpload(new Date("2026-11-16T11:01:00.000Z"), now), false);
  assert.equal(isExpiredUnassignedUpload(new Date("2026-11-16T10:59:59.000Z"), now), true);
});
