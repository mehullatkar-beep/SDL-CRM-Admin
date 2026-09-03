"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ClipboardList,
  Megaphone,
  MessageSquareText,
  PanelLeftClose,
  PanelLeftOpen,
  Package,
  Palette,
  Percent,
  TestTube,
  X,
  CircleHelp,
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
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

const NAV_GROUPS = [
  {
    label: "Portal Configurations",
    items: [
      { href: "/catalog/packages", label: "Packages", icon: Package, comingSoon: false },
      { href: "/catalog/tests", label: "Tests", icon: TestTube, comingSoon: false },
      { href: "/branding", label: "Branding & Checkout", icon: Palette, comingSoon: true },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/orders", label: "Booked orders", icon: ClipboardList, comingSoon: true },
    ],
  },
  {
    label: "Engagement",
    items: [
      { href: "/coupons", label: "Coupons", icon: Percent, comingSoon: false },
      { href: "/banners", label: "Banners", icon: Megaphone, comingSoon: false },
      { href: "/notifications", label: "Notifications", icon: Bell, comingSoon: false },
    ],
  },
  {
    label: "Patient care",
    items: [
      { href: "/feedback", label: "Feedback", icon: MessageSquareText, comingSoon: true },
      { href: "/queries", label: "Patient queries", icon: CircleHelp, comingSoon: true },
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
                    {item.comingSoon ? <SidebarMenuBadge>Soon</SidebarMenuBadge> : null}
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
