import { createHash } from "crypto";
import { prisma } from "./prisma";

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
  limit: number;
}

export async function checkRateLimit(
  identifier: string,
  max = 100,
  windowMs = 60000
): Promise<RateLimitResult> {
  const now = Date.now();
  const bucket = Math.floor(now / windowMs);
  const reset = (bucket + 1) * windowMs;
  const key = createHash("sha256").update(`${identifier}:${bucket}:${windowMs}`).digest("hex");
  const entry = await prisma.rateLimit.upsert({
    where: { key },
    create: { key, count: 1, expiresAt: new Date(reset) },
    update: { count: { increment: 1 } },
  });
  return {
    success: entry.count <= max,
    remaining: Math.max(0, max - entry.count),
    reset,
    limit: max,
  };
}

const IPV4 =
  /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/;
const IPV6 = /^[0-9a-f:]+$/i;

/** Basic shape check — rejects obvious header junk. */
export function isPlausibleIp(value: string): boolean {
  const ip = value.trim();
  if (!ip || ip.length > 45) return false;
  if (ip === "unknown" || ip.includes("/") || ip.includes(" ")) return false;
  if (IPV4.test(ip)) return true;
  if (ip.includes(":") && IPV6.test(ip)) return true;
  return false;
}

/**
 * Client IP for rate limiting.
 * - TRUST_PROXY=true: use X-Real-IP or the **rightmost** X-Forwarded-For hop
 *   (nearest trusted proxy). Never trust the leftmost client-supplied value alone.
 * - TRUST_PROXY≠true: ignore forwarding headers (spoofable). Prefer NextRequest.ip
 *   when present; otherwise a shared "direct" bucket (safe, not spoofable into many keys).
 */
export function requestIp(request: Request): string {
  if (process.env.TRUST_PROXY === "true") {
    const realIp = request.headers.get("x-real-ip")?.trim();
    if (realIp && isPlausibleIp(realIp)) return realIp;

    const xff = request.headers.get("x-forwarded-for");
    if (xff) {
      const parts = xff
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
      for (let i = parts.length - 1; i >= 0; i -= 1) {
        if (isPlausibleIp(parts[i])) return parts[i];
      }
    }
    return "unknown";
  }

  const maybeNextIp = (request as Request & { ip?: string | null }).ip;
  if (typeof maybeNextIp === "string" && isPlausibleIp(maybeNextIp)) return maybeNextIp;

  return "direct";
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "Retry-After": String(Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))),
  };
}
