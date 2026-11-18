import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { consumeBackupCode, decryptTotpSecret, verifyTotpCode } from "@/lib/totp";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totpCode: z.string().optional(),
});

const nextAuth = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Hasło", type: "password" },
        totpCode: { label: "Kod 2FA", type: "text" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase();
        const { password, totpCode } = parsed.data;
        if (!(await checkRateLimit(`login:${email}`, 10, 900000)).success) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { organization: true },
        });

        if (!user || !user.password) return null;
        if (!user.isActive) return null;

        if (user.role === "ORGANIZATION" && user.organization?.status !== "ACTIVE") return null;

        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch) return null;

        if (user.totpEnabled) {
          if (!totpCode?.trim() || !user.totpSecret) return null;

          const secret = decryptTotpSecret(user.totpSecret);
          const code = totpCode.trim();
          const totpOk = /^\d{6}$/.test(code) && verifyTotpCode(secret, code, user.email);

          if (!totpOk) {
            const remaining = await consumeBackupCode(user.totpBackupCodes, code);
            if (!remaining) return null;
            const consumed = await prisma.user.updateMany({
              where: { id: user.id, totpBackupCodes: { equals: user.totpBackupCodes } },
              data: { totpBackupCodes: remaining },
            });
            if (consumed.count !== 1) return null;
          }
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId || undefined,
          orgRole: user.orgRole || undefined,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
});

export const { handlers, signIn, signOut } = nextAuth;

// Recheck database state on every server access; a JWT alone may outlive a block or password reset.
export async function auth() {
  let session;
  try {
    session = await nextAuth.auth();
  } catch {
    // Invalid/expired JWT (e.g. AUTH_SECRET rotated or corrupt cookie) must not crash layouts.
    return null;
  }
  if (!session?.user?.id) return null;

  try {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, include: { organization: true } });
    if (!user?.isActive || (user.role === "ORGANIZATION" && user.organization?.status !== "ACTIVE")) return null;
    if (user.sessionVersion !== session.user.sessionVersion) return null;
    session.user.role = user.role;
    session.user.organizationId = user.organizationId ?? undefined;
    session.user.orgRole = user.orgRole ?? undefined;
    return session;
  } catch {
    // DB unavailable during local/dev — treat as signed-out rather than 500 the whole page.
    return null;
  }
}
