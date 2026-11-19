type TimedAnnouncement = {
  status: string;
  publishedAt: Date | null;
  bidsDeadline: Date | null;
};

export type AnnouncementTimeState = "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED" | "FINISHED";

const activeStatuses = new Set(["PUBLISHED", "IN_PROGRESS"]);
const finishedStatuses = new Set(["RESOLVED", "CANCELLED", "COMPLETED"]);

export function announcementTimeState(announcement: TimedAnnouncement, now = new Date()): AnnouncementTimeState {
  if (announcement.status === "DRAFT") return "DRAFT";
  if (finishedStatuses.has(announcement.status)) return "FINISHED";
  if (!activeStatuses.has(announcement.status) || !announcement.publishedAt || !announcement.bidsDeadline) return "CLOSED";
  if (announcement.publishedAt.getTime() > now.getTime()) return "SCHEDULED";
  if (announcement.bidsDeadline.getTime() <= now.getTime()) return "CLOSED";
  return "OPEN";
}

export function isAnnouncementOpen(announcement: TimedAnnouncement, now = new Date()) {
  return announcementTimeState(announcement, now) === "OPEN";
}
