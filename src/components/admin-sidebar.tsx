"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Megaphone,
  PanelLeftClose,
  PanelLeftOpen,
  Package,
  Percent,
  TestTube,
  X,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

const NAV_GROUPS = [
  {
    label: "Portal Configurations",
    items: [
      { href: "/catalog/packages", label: "Packages", icon: Package },
      { href: "/catalog/tests", label: "Tests", icon: TestTube },
    ],
  },
  {
    label: "Engagement",
    items: [
      { href: "/coupons", label: "Coupons", icon: Percent },
      { href: "/banners", label: "Banners", icon: Megaphone },
      { href: "/notifications", label: "Notifications", icon: Bell },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { state, isMobile, toggleSidebar } = useSidebar();
  const toggleLabel = isMobile
    ? "Close navigation"
    : state === "collapsed"
      ? "Expand sidebar"
      : "Collapse sidebar";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 items-center justify-center overflow-hidden border-b px-3 py-0 group-data-[collapsible=icon]:px-2">
        <Link
          href="/catalog/packages"
          className="flex h-full w-full min-w-0 items-center justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <BrandLogo />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {NAV_GROUPS.map((group, index) => (
          <SidebarGroup key={group.label} className={index === 0 ? "pt-4" : "pt-0"}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(item.href)}
                      tooltip={item.label}
                      className="h-9 data-active:bg-primary data-active:text-primary-foreground hover:data-active:bg-primary hover:data-active:text-primary-foreground"
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={toggleLabel}
              className="h-9"
              onClick={toggleSidebar}
            >
              {isMobile ? (
                <X />
              ) : state === "collapsed" ? (
                <PanelLeftOpen />
              ) : (
                <PanelLeftClose />
              )}
              <span>{toggleLabel}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
