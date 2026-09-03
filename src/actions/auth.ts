"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";

export async function loginAction(_prev: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/catalog/tests");

  try {
    const headerStore = await headers();
    const forwardedFor = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limit = await checkRateLimit("auth", `${forwardedFor}:${email.trim().toLowerCase()}`);
    if (!limit.success) return { error: "Too many sign-in attempts. Try again later." };

    const safeCallbackUrl =
      callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
        ? callbackUrl
        : "/catalog/tests";
    await signIn("credentials", {
      email,
      password,
      redirectTo: safeCallbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
