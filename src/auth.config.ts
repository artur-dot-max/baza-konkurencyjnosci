import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/logowanie",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const userRole = auth?.user?.role;
      const isOnPanel = nextUrl.pathname.startsWith("/panel");
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");
      const isOnContractor = nextUrl.pathname.startsWith("/wykonawca");

      if (isOnAdmin) {
        if (!isLoggedIn) return false;
        if (userRole !== "ADMIN") {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      if (isOnContractor) {
        if (!isLoggedIn) return false;
        if (userRole !== "CONTRACTOR" && userRole !== "ADMIN") {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      if (isOnPanel) {
        if (!isLoggedIn) return false;
        if (userRole !== "ORGANIZATION" && userRole !== "ADMIN") {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.orgRole = user.orgRole;
        token.sessionVersion = user.sessionVersion;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.organizationId = token.organizationId as string | undefined;
        session.user.orgRole = token.orgRole as string | undefined;
        session.user.sessionVersion = token.sessionVersion as number;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
