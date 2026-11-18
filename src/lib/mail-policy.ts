export const MAX_MAIL_ATTEMPTS = 10;

export function mailRetryDelayMs(attemptsAfterClaim: number): number {
  return Math.min(3_600_000, 60_000 * 2 ** Math.max(0, attemptsAfterClaim - 1));
}

export function safeMailError(error: unknown): string {
  const message = error instanceof Error ? error.message : "SMTP delivery failed";
  return message.replace(/[\r\n]+/g, " ").slice(0, 1000);
}
