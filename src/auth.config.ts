import type { NextAuthConfig } from "next-auth";
import { isNextProductionBuild } from "@/lib/env";

if (
  process.env.NODE_ENV === "production" &&
  !process.env.AUTH_SECRET &&
  !isNextProductionBuild()
) {
  throw new Error("AUTH_SECRET is required in production.");
}

export const authConfig = {
  trustHost: process.env.AUTH_TRUST_HOST === "true" || Boolean(process.env.VERCEL),
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
} satisfies NextAuthConfig;
