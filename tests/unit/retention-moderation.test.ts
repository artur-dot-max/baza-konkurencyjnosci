import test from "node:test";
import assert from "node:assert/strict";
import { isPastRetention, retentionCutoff, validateRetentionRule } from "../../src/lib/retention";
import { publicQuestionSchema, redactQuestionAuthor } from "../../src/lib/moderation";

test("retention uses an explicit policy and handles the cutoff boundary", () => {
  const rule = { name: "Logi bezpieczeństwa", days: 30 };
  const now = new Date("2026-11-16T12:00:00.000Z");
  assert.equal(retentionCutoff(rule, now).toISOString(), "2026-10-17T12:00:00.000Z");
  assert.equal(isPastRetention(new Date("2026-10-17T12:00:00.000Z"), rule, now), true);
  assert.equal(isPastRetention(new Date("2026-10-17T12:00:00.001Z"), rule, now), false);
});

test("retention rejects missing, fractional and non-positive periods", () => {
  assert.throws(() => validateRetentionRule({ name: "", days: 30 }), /Nazwa/);
  assert.throws(() => validateRetentionRule({ name: "Logi", days: 0 }), /dodatnią/);
  assert.throws(() => validateRetentionRule({ name: "Logi", days: 1.5 }), /pełnych dni/);
});

test("public question validation rejects control characters and invalid contact data", () => {
  const valid = { content: "Proszę o doprecyzowanie terminu realizacji.", authorEmail: "user@example.test" };
  assert.equal(publicQuestionSchema.safeParse(valid).success, true);
  assert.equal(publicQuestionSchema.safeParse({ ...valid, content: "Pytanie\u0000ukryte" }).success, false);
  assert.equal(publicQuestionSchema.safeParse({ ...valid, authorEmail: "nie-email" }).success, false);
});

test("public question response never exposes author identity", () => {
  const publicView = redactQuestionAuthor({
    id: "question-1",
    content: "Czy termin może zostać wydłużony?",
    authorName: "Jan Kowalski",
    authorEmail: "jan@example.test",
    isPublic: true,
  });
  assert.deepEqual(publicView, {
    id: "question-1",
    content: "Czy termin może zostać wydłużony?",
    isPublic: true,
  });
  assert.equal("authorEmail" in publicView, false);
  assert.equal("authorName" in publicView, false);
});
