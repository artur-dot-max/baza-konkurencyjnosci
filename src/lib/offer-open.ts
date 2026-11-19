import { prisma } from "./prisma";
import type { AuditRequestContext } from "./audit-context";

export async function markOffersOpened(
  announcementId: string,
  userId: string,
  context: AuditRequestContext,
): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const unopened = await tx.offer.findMany({
      where: { announcementId, submissionMethod: "PLATFORM", openedAt: null },
      select: { id: true },
    });
    let marked = 0;
    for (const offer of unopened) {
      const openedAt = new Date();
      const updated = await tx.offer.updateMany({
        where: { id: offer.id, openedAt: null },
        data: { openedAt, openedById: userId },
      });
      if (!updated.count) continue;
      marked += 1;
      await tx.auditLog.create({
        data: {
          action: "OPEN",
          entity: "OFFER",
          entityId: offer.id,
          userId,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          details: JSON.stringify({ announcementId, path: context.path, openedAt: openedAt.toISOString() }),
        },
      });
    }
    return marked;
  });
}

export async function markOfferOpened(
  offerId: string,
  announcementId: string,
  userId: string,
  context: AuditRequestContext,
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const openedAt = new Date();
    const updated = await tx.offer.updateMany({
      where: { id: offerId, submissionMethod: "PLATFORM", openedAt: null },
      data: { openedAt, openedById: userId },
    });
    if (!updated.count) return false;
    await tx.auditLog.create({
      data: {
        action: "OPEN",
        entity: "OFFER",
        entityId: offerId,
        userId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        details: JSON.stringify({ announcementId, path: context.path, openedAt: openedAt.toISOString() }),
      },
    });
    return true;
  });
}
