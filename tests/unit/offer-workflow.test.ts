import test from "node:test";
import assert from "node:assert/strict";
import { manualOfferSchema } from "../../src/lib/manual-offer";
import { offerReceiptText, queuedOfferAttachments } from "../../src/lib/offer-receipt";
import { serializeMailAttachments } from "../../src/lib/mail";

test("offer receipt contains the complete offer, submission date and attachments", () => {
  const attachments = [{ fileName: "safe.pdf", originalName: "Oferta cenowa.pdf", mimeType: "application/pdf" }];
  const text = offerReceiptText(
    { procedureNumber: "BK/2026/1", title: "Zakup wyposażenia" },
    {
      id: "offer-1",
      bidderName: "Wykonawca Testowy",
      bidderEmail: "oferta@example.test",
      bidderNip: "1234567890",
      price: "1234.56",
      description: "Pełna treść złożonej oferty.",
      submittedAt: new Date("2026-11-19T09:15:00.000Z"),
      submissionMethod: "PLATFORM",
    },
    attachments,
    "BIDDER",
    "https://example.test/ogloszenia/1",
  );
  assert.match(text, /Numer potwierdzenia: offer-1/);
  assert.match(text, /Data i godzina złożenia:/);
  assert.match(text, /Wykonawca: Wykonawca Testowy/);
  assert.match(text, /NIP: 1234567890/);
  assert.match(text, /Cena brutto: 1234.56 PLN/);
  assert.match(text, /Opis: Pełna treść złożonej oferty\./);
  assert.match(text, /Oferta cenowa\.pdf/);
  assert.deepEqual(JSON.parse(serializeMailAttachments(queuedOfferAttachments(attachments))!), attachments);
});

test("manual offer accepts external channels and rejects platform or future dates", () => {
  const base = {
    bidderName: "Wykonawca papierowy",
    bidderEmail: "",
    bidderNip: "",
    price: "100.00",
    description: "Oferta dostarczona w kopercie.",
    submittedAt: new Date(Date.now() - 60_000).toISOString(),
    entryNote: "Koperta nr 2",
    attachmentIds: [],
  };
  assert.equal(manualOfferSchema.safeParse({ ...base, submissionMethod: "IN_PERSON" }).success, true);
  assert.equal(manualOfferSchema.safeParse({ ...base, submissionMethod: "E_DELIVERY" }).success, true);
  assert.equal(manualOfferSchema.safeParse({ ...base, submissionMethod: "PLATFORM" }).success, false);
  assert.equal(manualOfferSchema.safeParse({ ...base, submissionMethod: "EMAIL", submittedAt: new Date(Date.now() + 60_000).toISOString() }).success, false);
});
