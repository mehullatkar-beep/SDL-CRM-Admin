import type { NextAuthConfig } from "next-auth";

if (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET) {
  throw new Error("AUTH_SECRET is required in production.");
}

export const authConfig = {
  trustHost: process.env.AUTH_TRUST_HOST === "true",
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
} satisfies NextAuthConfig;
