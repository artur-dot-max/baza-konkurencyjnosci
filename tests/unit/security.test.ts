import { test } from "node:test";
import assert from "node:assert/strict";
import { createUploadToken, verifyUploadToken } from "../../src/lib/upload-token";
import { sanitizeRichText } from "../../src/lib/sanitize";
import { announcementSchema, publishedBidsDeadlineChangeError } from "../../src/lib/announcement-validation";
import { buildOfferPayload, offerSchema } from "../../src/lib/offer-validation";
import { canReadAnnouncement, pagination } from "../../src/lib/access";
import { sha256Checksum } from "../../src/lib/checksum";
import { auditActionLabel, auditEntityLabel } from "../../src/lib/utils";
import { isPlausibleIp, requestIp } from "../../src/lib/rate-limit";
import { csvSafeCell, ownsOffer } from "../../src/lib/offer-security";

test("upload signature prevents tampering, cross-user reuse, and expired uploads", () => {
  process.env.AUTH_SECRET = "unit-test-only-secret";
  const payload = { userId: "owner", fileName: "file.pdf", originalName: "file.pdf", mimeType: "application/pdf", fileSize: 20, filePath: "/api/uploads/file.pdf", expiresAt: Date.now() + 60000 };
  const token = createUploadToken(payload);
  assert.ok(verifyUploadToken(token, "owner")); assert.equal(verifyUploadToken(token, "other"), null);
  assert.equal(verifyUploadToken(token + "x", "owner"), null);
  assert.equal(verifyUploadToken(createUploadToken({ ...payload, expiresAt: Date.now() - 1 }), "owner"), null);
});
test("stored rich text strips executable content and unsafe links", () => {
  const html = sanitizeRichText('<p onclick="alert(1)">Opis<script>alert(1)</script><a href="javascript:alert(1)">link</a><img src=x onerror=alert(1)></p>');
  assert.ok(html.includes("Opis")); assert.doesNotMatch(html, /script|onclick|onerror|javascript:/i);
});
test("draft and future announcement cannot be read anonymously", () => {
  assert.equal(canReadAnnouncement(null, { status: "DRAFT", publishedAt: new Date(0), organizationId: "a" }), false);
  assert.equal(canReadAnnouncement(null, { status: "PUBLISHED", publishedAt: new Date(Date.now() + 100000), organizationId: "a" }), false);
  assert.equal(canReadAnnouncement(null, { status: "PUBLISHED", publishedAt: new Date(0), organizationId: "a" }), true);
  assert.deepEqual(pagination("https://test/?page=NaN&limit=999999"), { page: 1, limit: 100, skip: 0 });
});
test("publication rejects invalid dates, expired deadlines and criteria totals", () => {
  const latePublication = new Date(); latePublication.setHours(23, 0, 0, 0);
  const exactDeadline = new Date(latePublication); exactDeadline.setDate(exactDeadline.getDate() + 7); exactDeadline.setHours(0, 0, 0, 0);
  const data = { procedureNumber: "1", title: "Dostawa komputerów", description: "Opis zamówienia ".repeat(10), orderType: "SUPPLIES", voivodeship: "mazowieckie", location: "Warszawa", executionTerm: "30 dni", criteria: [{ name: "Cena", weight: 100 }], status: "PUBLISHED", publishedAt: new Date().toISOString(), bidsDeadline: new Date(Date.now() + 8 * 86400000).toISOString(), submissionMethods: ["PLATFORM"] };
  assert.equal(announcementSchema.safeParse(data).success, true);
  assert.equal(announcementSchema.safeParse({ ...data, publishedAt: latePublication.toISOString(), bidsDeadline: exactDeadline.toISOString() }).success, false);
  assert.equal(announcementSchema.safeParse({ ...data, publishedAt: latePublication.toISOString(), bidsDeadline: new Date(latePublication.getTime() + 7 * 86400000).toISOString() }).success, true);
  assert.equal(announcementSchema.safeParse({ ...data, bidsDeadline: new Date(Date.now() + 6 * 86400000).toISOString() }).success, false);
  assert.equal(announcementSchema.safeParse({ ...data, submissionMethods: [] }).success, false);
  assert.equal(announcementSchema.safeParse({ ...data, submissionMethods: ["E_DELIVERY"], eDeliveryAddress: "" }).success, false);
  assert.equal(announcementSchema.safeParse({ ...data, submissionMethods: ["EMAIL", "PLATFORM", "E_DELIVERY"], eDeliveryAddress: "AE:PL-12345-67890-ABCDE-12" }).success, true);
  assert.equal(announcementSchema.safeParse({ ...data, bidsDeadline: "not-a-date" }).success, false);
  assert.equal(announcementSchema.safeParse({ ...data, bidsDeadline: new Date(0).toISOString() }).success, false);
  assert.equal(announcementSchema.safeParse({ ...data, criteria: [{ name: "Cena", weight: 99 }] }).success, false);
});
test("document checksum is stable and sensitive to content changes", () => {
  const first = sha256Checksum({ title: "Ogłoszenie", nested: { b: 2, a: 1 } });
  const reordered = sha256Checksum({ nested: { a: 1, b: 2 }, title: "Ogłoszenie" });
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.equal(first, reordered);
  assert.notEqual(first, sha256Checksum({ title: "Zmienione", nested: { a: 1, b: 2 } }));
});
test("audit log codes have Polish labels and unknown codes remain readable", () => {
  assert.equal(auditActionLabel("CREATE"), "Utworzono");
  assert.equal(auditActionLabel("PASSWORD_RESET"), "Zmieniono hasło");
  assert.equal(auditEntityLabel("ANNOUNCEMENT"), "Ogłoszenie");
  assert.equal(auditEntityLabel("NEWS"), "Aktualność");
  assert.equal(auditEntityLabel("MESSAGE"), "Wiadomość");
  assert.equal(auditActionLabel("CUSTOM_ACTION"), "CUSTOM_ACTION");
});
test("published deadline cannot be shortened or reopened after expiry", () => {
  const now = new Date("2026-10-01T12:00:00.000Z");
  const open = new Date("2026-10-10T12:00:00.000Z");
  const later = new Date("2026-10-20T12:00:00.000Z");
  const earlier = new Date("2026-10-05T12:00:00.000Z");
  const expired = new Date("2026-09-01T12:00:00.000Z");
  assert.equal(publishedBidsDeadlineChangeError(open, undefined, now), null);
  assert.equal(publishedBidsDeadlineChangeError(open, later.toISOString(), now), null);
  assert.match(publishedBidsDeadlineChangeError(open, earlier.toISOString(), now) || "", /skrócić/i);
  assert.match(publishedBidsDeadlineChangeError(expired, later.toISOString(), now) || "", /upływie/i);
  assert.match(publishedBidsDeadlineChangeError(open, null, now) || "", /usunąć/i);
});

test("requestIp ignores spoofable XFF unless TRUST_PROXY and uses rightmost hop", () => {
  const previous = process.env.TRUST_PROXY;
  try {
    process.env.TRUST_PROXY = "false";
    const spoofed = new Request("http://localhost/api", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    assert.equal(requestIp(spoofed), "direct");

    process.env.TRUST_PROXY = "true";
    const appended = new Request("http://localhost/api", {
      headers: { "x-forwarded-for": "9.9.9.9, 10.0.0.1" },
    });
    assert.equal(requestIp(appended), "10.0.0.1");

    const realIp = new Request("http://localhost/api", {
      headers: { "x-real-ip": "203.0.113.10", "x-forwarded-for": "9.9.9.9, 10.0.0.1" },
    });
    assert.equal(requestIp(realIp), "203.0.113.10");
    assert.equal(isPlausibleIp("not-an-ip"), false);
    assert.equal(isPlausibleIp("192.168.1.1"), true);
  } finally {
    if (previous === undefined) delete process.env.TRUST_PROXY;
    else process.env.TRUST_PROXY = previous;
  }
});

test("offer payload requires explicit confirmation because checkbox is not in FormData", () => {
  const form = new FormData();
  form.set("bidderName", "Wykonawca testowy sp. z o.o.");
  form.set("bidderEmail", "oferta@example.test");
  form.set("bidderNip", "9876543210");
  form.set("price", "9876.54");
  form.set("description", "Dostawa zgodna ze specyfikacją.");
  form.set("website", "");
  assert.equal(form.get("confirmation"), null);
  assert.equal(offerSchema.safeParse(buildOfferPayload(form, form.get("confirmation") === "on")).success, false);
  assert.equal(offerSchema.safeParse(buildOfferPayload(form, false)).success, false);
  assert.equal(offerSchema.safeParse(buildOfferPayload(form, true)).success, true);
});

test("CSV export neutralizes spreadsheet formulas and escapes quotes", () => {
  assert.equal(csvSafeCell("=HYPERLINK(\"https://evil.test\")"), `"'=HYPERLINK(""https://evil.test"")"`);
  assert.equal(csvSafeCell("  +1+1"), `"'  +1+1"`);
  assert.equal(csvSafeCell("Zwykła wartość"), `"Zwykła wartość"`);
});

test("offer upload token is bound to its actor and purpose", () => {
  process.env.AUTH_SECRET = "unit-test-only-secret";
  const payload = {
    userId: "guest:203.0.113.10",
    fileName: "offer.pdf",
    originalName: "offer.pdf",
    mimeType: "application/pdf",
    fileSize: 20,
    filePath: "/api/uploads/offer.pdf",
    expiresAt: Date.now() + 60_000,
    purpose: "offer" as const,
  };
  const token = createUploadToken(payload);
  assert.ok(verifyUploadToken(token, payload.userId, "offer"));
  assert.equal(verifyUploadToken(token, "guest:203.0.113.11", "offer"), null);
  assert.equal(verifyUploadToken(token, payload.userId, "announcement"), null);
});

test("offer ownership requires the account recorded at submission time", () => {
  assert.equal(ownsOffer("contractor-1", "contractor-1"), true);
  assert.equal(ownsOffer("attacker-with-same-email", "contractor-1"), false);
  assert.equal(ownsOffer("new-account", null), false);
});
