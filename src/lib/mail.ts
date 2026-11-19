import nodemailer from "nodemailer";
import path from "path";
import { lstat } from "fs/promises";
import { prisma } from "./prisma";
import { MAX_MAIL_ATTEMPTS, mailRetryDelayMs, safeMailError } from "./mail-policy";
export function appUrl(path: string) { return new URL(path, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").toString(); }

export type QueuedMailAttachment = {
  fileName: string;
  originalName: string;
  mimeType: string;
};

export function serializeMailAttachments(attachments: QueuedMailAttachment[]): string | null {
  return attachments.length ? JSON.stringify(attachments) : null;
}

async function resolveMailAttachments(serialized: string | null) {
  if (!serialized) return undefined;
  const parsed = JSON.parse(serialized) as QueuedMailAttachment[];
  if (!Array.isArray(parsed) || parsed.length > 5) throw new Error("Invalid queued mail attachments");
  const uploadRoot = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads"));
  const resolved = [];
  for (const attachment of parsed) {
    if (
      !attachment ||
      typeof attachment.fileName !== "string" ||
      path.basename(attachment.fileName) !== attachment.fileName ||
      typeof attachment.originalName !== "string" ||
      !attachment.originalName ||
      typeof attachment.mimeType !== "string"
    ) {
      throw new Error("Invalid queued mail attachment");
    }
    const filePath = path.resolve(uploadRoot, attachment.fileName);
    if (!filePath.startsWith(`${uploadRoot}${path.sep}`)) throw new Error("Mail attachment outside upload directory");
    const stat = await lstat(filePath);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("Invalid mail attachment file");
    resolved.push({ filename: attachment.originalName.replace(/[\r\n]/g, "_"), contentType: attachment.mimeType, path: filePath });
  }
  return resolved;
}

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
      const attachments = await resolveMailAttachments(mail.attachments);
      await transport.sendMail({ from: process.env.MAIL_FROM, to: mail.to, subject: mail.subject, text: mail.text,
        replyTo: mail.replyTo || undefined, attachments, messageId: `<${mail.id}@${new URL(appUrl("/")).hostname}>` });
      await prisma.emailOutbox.update({ where: { id: mail.id }, data: { sentAt: new Date(), text: "", attachments: null, lastError: null } });
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
