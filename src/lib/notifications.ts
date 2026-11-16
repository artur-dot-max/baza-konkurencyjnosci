import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export type NotificationInput = {
  type: string;
  title: string;
  body: string;
  href?: string;
};

export async function createNotificationsForUsers(
  db: Tx | typeof import("@/lib/prisma").prisma,
  userIds: string[],
  input: NotificationInput
) {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length) return;
  await db.notification.createMany({
    data: unique.map((userId) => ({
      userId,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href,
    })),
  });
}

export async function notifyOrganizationUsers(
  db: Tx | typeof import("@/lib/prisma").prisma,
  organizationId: string,
  input: NotificationInput
) {
  const users = await db.user.findMany({
    where: { organizationId, isActive: true, role: "ORGANIZATION" },
    select: { id: true },
  });
  await createNotificationsForUsers(
    db,
    users.map((u) => u.id),
    input
  );
}
