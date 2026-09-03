"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setNotificationTriggerEnabled } from "@/actions/notifications";
import { SwitchFieldRow } from "@/components/switch-field-row";
import { ViewOnlyNotice } from "@/components/view-only-notice";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  groupNotificationTriggers,
  type NotificationTrigger,
} from "@/lib/notification-triggers";

export function NotificationsCatalog({
  triggers: initial,
  canEdit,
}: {
  triggers: NotificationTrigger[];
  canEdit: boolean;
}) {
  const [, startTransition] = useTransition();
  const [enabledById, setEnabledById] = useState(() =>
    Object.fromEntries(initial.map((trigger) => [trigger.id, trigger.enabled])),
  );

  const grouped = groupNotificationTriggers(
    initial.map((trigger) => ({
      ...trigger,
      enabled: enabledById[trigger.id] ?? trigger.enabled,
    })),
  );

  function toggle(trigger: NotificationTrigger, enabled: boolean) {
    if (!canEdit) return;
    const previous = enabledById[trigger.id] ?? trigger.enabled;
    setEnabledById((current) => ({ ...current, [trigger.id]: enabled }));
    startTransition(async () => {
      const result = await setNotificationTriggerEnabled(trigger.id, enabled);
      if (result.error) {
        setEnabledById((current) => ({ ...current, [trigger.id]: previous }));
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="max-w-2xl space-y-1">
        <p className="text-muted-foreground text-sm leading-relaxed">
          Choose which patient notifications this lab sends. Message copy and channels are set later.
        </p>
      </div>
      {!canEdit ? <ViewOnlyNotice /> : null}

      {grouped.map((group) => (
        <Card key={group.id}>
          <CardHeader className="border-b">
            <CardTitle>{group.label}</CardTitle>
            <CardDescription>{group.description}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {group.triggers.map((trigger) => (
              <SwitchFieldRow
                key={trigger.id}
                id={`notification-${trigger.id}`}
                label={trigger.name}
                description={trigger.description}
                checked={trigger.enabled}
                disabled={!canEdit}
                onCheckedChange={(enabled) => toggle(trigger, enabled)}
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
