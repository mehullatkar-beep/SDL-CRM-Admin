import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AdminHeader } from "@/components/admin-header";
import { AdminSidebar } from "@/components/admin-sidebar";
import { requireSession } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  if (!session.user) redirect("/login");
  const cookieStore = await cookies();
  const defaultSidebarOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <a
        href="#admin-content"
        className="bg-background text-foreground fixed top-2 left-2 z-50 -translate-y-16 rounded-md border px-3 py-2 text-sm shadow-md transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
      <AdminSidebar />
      <SidebarInset id="admin-content" tabIndex={-1}>
        <AdminHeader user={session.user} />
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
