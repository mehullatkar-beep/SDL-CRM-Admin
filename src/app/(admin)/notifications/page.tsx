import Link from "next/link";
import { NotificationsCatalog } from "@/components/notifications/notifications-catalog";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { AdminPageBody } from "@/components/admin-page-body";
import { loadNotificationTriggers } from "@/lib/notification-queries";
import { requireSession } from "@/lib/session";

export default async function NotificationsPage() {
  const session = await requireSession();
  let triggers: Awaited<ReturnType<typeof loadNotificationTriggers>> = [];
  let error: string | null = null;
  try {
    triggers = await loadNotificationTriggers();
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Could not load notifications.";
  }

  if (error) {
    return (
      <AdminPageBody>
        <ErrorState
          title="Notifications unavailable"
          description={error}
          action={
            <Button variant="outline" asChild>
              <Link href="/notifications">Retry</Link>
            </Button>
          }
        />
      </AdminPageBody>
    );
  }

  return (
    <AdminPageBody className="py-4 lg:py-5">
      <NotificationsCatalog triggers={triggers} canEdit={session.user.role === "admin"} />
    </AdminPageBody>
  );
}
