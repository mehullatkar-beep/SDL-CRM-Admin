import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { StaffRole } from "@/lib/catalog";

const getSession = cache(auth);

export async function requireSession() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.user.role !== "admin") {
    return { session, error: "Only admins can change the catalog." as const };
  }
  return { session, error: null };
}

export function canMutate(role: StaffRole) {
  return role === "admin";
}
