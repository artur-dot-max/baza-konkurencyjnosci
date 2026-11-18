import test from "node:test";
import assert from "node:assert/strict";
import { assertUploadRequestSize, UploadValidationError, validateUploadedFile } from "../../src/lib/file-validation";

test("upload rejects ZIP archives even when the browser declares application/zip", async () => {
  const file = new File([Buffer.from("PK\u0003\u0004untrusted")], "archive.zip", { type: "application/zip" });
  await assert.rejects(() => validateUploadedFile(file), (error: unknown) => {
    assert.ok(error instanceof UploadValidationError);
    assert.match(error.message, /Niedozwolony typ pliku/);
    return true;
  });
});

test("upload rejects a ZIP payload renamed to PDF", async () => {
  const file = new File([Buffer.from("PK\u0003\u0004untrusted")], "document.pdf", { type: "application/pdf" });
  await assert.rejects(() => validateUploadedFile(file), (error: unknown) => {
    assert.ok(error instanceof UploadValidationError);
    assert.match(error.message, /Zawartość/);
    return true;
  });
});

test("upload rejects an oversized request before parsing multipart data", () => {
  const request = new Request("https://example.test/api/upload", {
    method: "POST",
    headers: { "content-length": String(12 * 1024 * 1024) },
  });
  assert.throws(() => assertUploadRequestSize(request), (error: unknown) => {
    assert.ok(error instanceof UploadValidationError);
    assert.equal(error.status, 413);
    return true;
  });
});
