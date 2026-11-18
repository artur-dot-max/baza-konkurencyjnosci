import nodemailer from "nodemailer";
import { prisma } from "./prisma";
import { MAX_MAIL_ATTEMPTS, mailRetryDelayMs, safeMailError } from "./mail-policy";
export function appUrl(path: string) { return new URL(path, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").toString(); }
export async function deliverPendingMail() {
  if (!process.env.SMTP_HOST || !process.env.MAIL_FROM) throw new Error("SMTP configuration is missing");
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true", requireTLS: process.env.SMTP_REQUIRE_TLS !== "false",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
    connectionTimeout: 10000, socketTimeout: 20000,
  });
  const pending = await prisma.emailOutbox.findMany({
    where: { sentAt: null, failedAt: null, availableAt: { lte: new Date() }, attempts: { lt: MAX_MAIL_ATTEMPTS } }, orderBy: { createdAt: "asc" }, take: 25,
  });
  for (const mail of pending) {
    const claimed = await prisma.emailOutbox.updateMany({
      where: { id: mail.id, sentAt: null, availableAt: mail.availableAt },
      data: { availableAt: new Date(Date.now() + 60000), attempts: { increment: 1 } },
    });
    if (!claimed.count) continue;
    try {
      await transport.sendMail({ from: process.env.MAIL_FROM, to: mail.to, subject: mail.subject, text: mail.text,
        replyTo: mail.replyTo || undefined, messageId: `<${mail.id}@${new URL(appUrl("/")).hostname}>` });
      await prisma.emailOutbox.update({ where: { id: mail.id }, data: { sentAt: new Date(), text: "", lastError: null } });
    } catch (error) {
      const attemptsAfterClaim = mail.attempts + 1;
      const permanentlyFailed = attemptsAfterClaim >= MAX_MAIL_ATTEMPTS;
      await prisma.$transaction(async (tx) => {
        await tx.emailOutbox.update({ where: { id: mail.id }, data: {
          availableAt: new Date(Date.now() + mailRetryDelayMs(attemptsAfterClaim)),
          lastError: safeMailError(error),
          ...(permanentlyFailed && { failedAt: new Date() }),
        } });
        if (permanentlyFailed) {
          await tx.errorLog.create({ data: {
            message: "Wiadomość e-mail wyczerpała limit prób wysyłki",
            statusCode: 503,
            path: "email_outbox",
            details: JSON.stringify({ mailId: mail.id, attempts: attemptsAfterClaim }),
          } });
        }
      });
      console.error("SMTP delivery failed for queued message", mail.id);
    }
  }
  await prisma.passwordReset.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  await prisma.emailOutbox.deleteMany({ where: { sentAt: { lt: new Date(Date.now() - 30 * 86400000) } } });
  await prisma.rateLimit.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}
