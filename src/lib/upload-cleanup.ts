import { readdir, stat, unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const CLEANUP_GRACE_MS = 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
let lastCleanupAt = 0;

export function isExpiredUnassignedUpload(modifiedAt: Date, now = new Date()): boolean {
  return modifiedAt.getTime() < now.getTime() - TOKEN_TTL_MS - CLEANUP_GRACE_MS;
}

export async function cleanupOrphanedUploads(now = new Date(), force = false): Promise<number> {
  if (!force && now.getTime() - lastCleanupAt < CLEANUP_INTERVAL_MS) return 0;
  lastCleanupAt = now.getTime();

  const uploadDirectory = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads"));
  let entries;
  try {
    entries = await readdir(uploadDirectory, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return 0;
    throw error;
  }

  const candidates: string[] = [];
  for (const entry of entries) {
    if (!entry.isFile() || path.basename(entry.name) !== entry.name) continue;
    const info = await stat(path.join(uploadDirectory, entry.name));
    if (isExpiredUnassignedUpload(info.mtime, now)) candidates.push(entry.name);
  }
  if (!candidates.length) return 0;

  const referenced = new Set<string>();
  for (let offset = 0; offset < candidates.length; offset += 500) {
    const names = candidates.slice(offset, offset + 500);
    const [announcementFiles, offerFiles] = await Promise.all([
      prisma.attachment.findMany({ where: { fileName: { in: names } }, select: { fileName: true } }),
      prisma.offerAttachment.findMany({ where: { fileName: { in: names } }, select: { fileName: true } }),
    ]);
    for (const file of [...announcementFiles, ...offerFiles]) referenced.add(file.fileName);
  }

  let removed = 0;
  for (const fileName of candidates) {
    if (referenced.has(fileName)) continue;
    const target = path.resolve(uploadDirectory, fileName);
    if (!target.startsWith(`${uploadDirectory}${path.sep}`)) continue;
    await unlink(target).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
    removed += 1;
  }
  return removed;
}
