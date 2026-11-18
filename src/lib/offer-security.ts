import type { Session } from "next-auth";
import { requestIp } from "@/lib/rate-limit";

/** Stable owner key used by both offer upload and offer submission. */
export function offerUploadOwner(session: Session | null, request: Request): string {
  return session?.user?.id || `guest:${requestIp(request)}`;
}

export function ownsOffer(userId: string | undefined, offerUserId: string | null): boolean {
  return !!userId && offerUserId === userId;
}

/** Prevent spreadsheet applications from interpreting attacker-controlled CSV cells as formulas. */
export function csvSafeCell(value: unknown): string {
  const text = String(value ?? "");
  const neutralized = /^[\t\r\n ]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${neutralized.replace(/"/g, '""')}"`;
}
