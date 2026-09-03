import type { StaffRole } from "@/lib/catalog";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: StaffRole;
  }

  interface Session {
    user: {
      id: string;
      role: StaffRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: StaffRole;
  }
}
