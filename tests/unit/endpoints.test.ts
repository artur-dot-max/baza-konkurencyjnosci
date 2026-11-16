import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST as runMailWorker } from "../../src/app/api/internal/mail/route";
import { POST as createUser } from "../../src/app/api/users/route";
import { middleware } from "../../src/middleware";

test("internal mail endpoint rejects missing and incorrect bearer secrets", async () => {
  const previous = process.env.CRON_SECRET;
  process.env.CRON_SECRET = "unit-test-cron-secret";
  try {
    const missing = await runMailWorker(new Request("http://localhost/api/internal/mail", { method: "POST" }));
    assert.equal(missing.status, 401);

    const incorrect = await runMailWorker(new Request("http://localhost/api/internal/mail", {
      method: "POST",
      headers: { authorization: "Bearer wrong-secret" },
    }));
    assert.equal(incorrect.status, 401);
    assert.deepEqual(await incorrect.json(), { error: "Unauthorized" });
  } finally {
    if (previous === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = previous;
  }
});

test("users collection endpoint rejects an unsupported POST method", async () => {
  const response = await createUser(new Request("http://localhost/api/users", { method: "POST" }));
  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("middleware emits a unique strict CSP without unsafe-inline", () => {
  const first = middleware(new NextRequest("https://example.test/ogloszenia"));
  const second = middleware(new NextRequest("https://example.test/ogloszenia"));
  const firstCsp = first.headers.get("content-security-policy") ?? "";
  const secondCsp = second.headers.get("content-security-policy") ?? "";

  assert.match(firstCsp, /script-src 'self' 'nonce-[a-f0-9]+' 'strict-dynamic'/);
  assert.match(firstCsp, /style-src 'self' 'nonce-[a-f0-9]+'/);
  assert.match(firstCsp, /style-src-attr 'unsafe-hashes'/);
  assert.match(firstCsp, /object-src 'none'/);
  assert.doesNotMatch(firstCsp, /unsafe-inline/);
  assert.notEqual(firstCsp, secondCsp);
});
