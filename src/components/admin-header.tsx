"use client";

import Link from "next/link";
import { ChevronDown, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/actions/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { StaffRole } from "@/lib/catalog";
import { DEFERRED_MODULES, isDeferredModule } from "@/lib/deferred-modules";

type HeaderUser = {
  name?: string | null;
  email?: string | null;
  role: StaffRole;
};

const ROUTE_LABELS = [
  { match: /^\/catalog\/tests/, section: "Portal Configurations", page: "Tests" },
  {
    match: /^\/catalog\/packages\/new/,
    section: "Packages",
    page: "New package",
    sectionHref: "/catalog/packages",
  },
  {
    match: /^\/catalog\/packages\/[^/]+/,
    section: "Packages",
    page: "Package details",
    sectionHref: "/catalog/packages",
  },
  { match: /^\/catalog\/packages/, section: "Portal Configurations", page: "Packages" },
  {
    match: /^\/coupons\/new/,
    section: "Coupons",
    page: "New coupon",
    sectionHref: "/coupons",
  },
  {
    match: /^\/coupons\/[^/]+/,
    section: "Coupons",
    page: "Coupon details",
    sectionHref: "/coupons",
  },
  { match: /^\/coupons/, section: "Engagement", page: "Coupons" },
  {
    match: /^\/banners\/new/,
    section: "Banners",
    page: "New banner",
    sectionHref: "/banners",
  },
  {
    match: /^\/banners\/[^/]+/,
    section: "Banners",
    page: "Banner details",
    sectionHref: "/banners",
  },
  { match: /^\/banners/, section: "Engagement", page: "Banners" },
  { match: /^\/notifications/, section: "Engagement", page: "Notifications" },
];

function initials(name?: string | null) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AdminHeader({ user }: { user: HeaderUser }) {
  const pathname = usePathname();
  const moduleKey = pathname.split("/")[1] ?? "";
  const deferredRoute = isDeferredModule(moduleKey) ? DEFERRED_MODULES[moduleKey] : null;
  const route = deferredRoute
    ? { section: deferredRoute.section, page: deferredRoute.title, sectionHref: undefined }
    : (ROUTE_LABELS.find(({ match }) => match.test(pathname)) ?? ROUTE_LABELS[0]);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
      <SidebarTrigger className="mr-3 md:hidden" />

      <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
        {route.sectionHref ? (
          <Link
            href={route.sectionHref}
            className="text-muted-foreground hover:text-foreground hidden truncate sm:inline"
          >
            {route.section}
          </Link>
        ) : (
          <span className="text-muted-foreground hidden sm:inline">{route.section}</span>
        )}
        <span className="text-border hidden sm:inline">/</span>
        <h1 className="truncate text-sm font-medium">{route.page}</h1>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-10 gap-2 rounded-xl px-2 hover:bg-muted"
            aria-label="Open profile menu"
          >
            <span className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg text-xs font-semibold">
              {initials(user.name)}
            </span>
            <span className="hidden min-w-0 text-left sm:block">
              <span className="block max-w-32 truncate text-sm font-medium leading-4">
                {user.name ?? "Account"}
              </span>
              <span className="text-muted-foreground block text-xs capitalize leading-4">
                {user.role}
              </span>
            </span>
            <ChevronDown className="text-muted-foreground hidden size-3.5 sm:block" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 p-1.5">
          <DropdownMenuLabel className="px-2 py-2 font-normal">
            <span className="block truncate text-sm font-medium text-foreground">
              {user.name ?? "Account"}
            </span>
            <span className="text-muted-foreground mt-0.5 block truncate text-xs">
              {user.email}
            </span>
            <Badge variant="secondary" className="mt-2 capitalize">
              {user.role}
            </Badge>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <form action={logoutAction}>
            <DropdownMenuItem asChild>
              <button type="submit" className="w-full">
                <LogOut />
                Sign out
              </button>
            </DropdownMenuItem>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
