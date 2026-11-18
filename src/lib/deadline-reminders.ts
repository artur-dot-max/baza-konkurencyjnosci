import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/mail";
import { notifyOrganizationUsers } from "@/lib/notifications";
import { formatDate } from "@/lib/utils";

/** Send deadline reminders (3 days / 1 day) as email + in-app notifications. Idempotent via DeadlineReminder. */
export async function processDeadlineReminders() {
  const now = new Date();
  const in4Days = new Date(now.getTime() + 4 * 86400000);

  const announcements = await prisma.announcement.findMany({
    where: {
      status: { in: ["PUBLISHED", "IN_PROGRESS"] },
      bidsDeadline: { gt: now, lte: in4Days },
    },
    include: {
      organization: {
        select: {
          email: true,
          users: { where: { isActive: true }, select: { id: true, email: true } },
        },
      },
    },
  });

  for (const ann of announcements) {
    if (!ann.bidsDeadline) continue;
    const msLeft = ann.bidsDeadline.getTime() - now.getTime();
    const daysLeft = msLeft / 86400000;
    const kinds: Array<{ kind: "3d" | "1d"; match: boolean; label: string }> = [
      { kind: "3d", match: daysLeft <= 3.5 && daysLeft > 1.5, label: "3 dni" },
      { kind: "1d", match: daysLeft <= 1.5 && daysLeft > 0, label: "1 dzień" },
    ];

    for (const item of kinds) {
      if (!item.match) continue;
      const panelLink = appUrl(`/panel/ogloszenia/${ann.id}`);
      const title = `Zbliża się termin ofert (${item.label})`;
      const body = `Termin składania ofert dla „${ann.title}" (${ann.procedureNumber}) upływa ${formatDate(ann.bidsDeadline)}.`;

      await prisma.$transaction(async (tx) => {
        const claimed = await tx.deadlineReminder.createMany({
          data: [{ announcementId: ann.id, kind: item.kind }],
          skipDuplicates: true,
        });
        if (!claimed.count) return;
        await notifyOrganizationUsers(tx, ann.organizationId, {
          type: `DEADLINE_${item.kind.toUpperCase()}`,
          title,
          body,
          href: `/panel/ogloszenia/${ann.id}/oferty`,
        });
        const recipients = new Set<string>([
          ann.organization.email,
          ...ann.organization.users.map((u) => u.email),
        ]);
        await tx.emailOutbox.createMany({
          data: [...recipients].map((to) => ({
            to,
            subject: `${title}: ${ann.procedureNumber}`,
            text: [body, "", `Panel: ${panelLink}`].join("\n"),
          })),
        });
      });
    }
  }
}
