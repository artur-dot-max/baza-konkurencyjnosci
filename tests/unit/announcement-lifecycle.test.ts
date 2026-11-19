import assert from "node:assert/strict";
import test from "node:test";
import { announcementTimeState, isAnnouncementOpen } from "../../src/lib/announcement-lifecycle";

const now = new Date("2027-01-10T10:00:00.000Z");

test("announcement opens and closes automatically at the configured time", () => {
  const base = {
    status: "PUBLISHED",
    publishedAt: new Date("2027-01-10T10:00:00.000Z"),
    bidsDeadline: new Date("2027-01-17T10:00:00.000Z"),
  };

  assert.equal(announcementTimeState(base, new Date(now.getTime() - 1)), "SCHEDULED");
  assert.equal(announcementTimeState(base, now), "OPEN");
  assert.equal(isAnnouncementOpen(base, now), true);
  assert.equal(announcementTimeState(base, base.bidsDeadline), "CLOSED");
  assert.equal(isAnnouncementOpen(base, base.bidsDeadline), false);
});

test("draft and finished announcements never accept offers", () => {
  const dates = {
    publishedAt: new Date(now.getTime() - 60_000),
    bidsDeadline: new Date(now.getTime() + 60_000),
  };

  assert.equal(announcementTimeState({ ...dates, status: "DRAFT" }, now), "DRAFT");
  assert.equal(announcementTimeState({ ...dates, status: "RESOLVED" }, now), "FINISHED");
  assert.equal(isAnnouncementOpen({ ...dates, status: "CANCELLED" }, now), false);
});
