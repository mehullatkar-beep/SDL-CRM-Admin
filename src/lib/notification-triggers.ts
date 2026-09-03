export const NOTIFICATION_TRIGGER_GROUPS = [
  {
    id: "common",
    label: "Common",
    description: "Sent for every booking type.",
  },
  {
    id: "self_registration",
    label: "Self registration",
    description: "Patient walks in and registers at the lab.",
  },
  {
    id: "appointment",
    label: "Appointment",
    description: "Patient books a slot at the lab.",
  },
  {
    id: "home_collection",
    label: "Home collection",
    description: "A phlebotomist collects the sample at home.",
  },
  {
    id: "kit",
    label: "Kit",
    description: "A self-collection kit is shipped to the patient.",
  },
] as const;

export type NotificationTriggerGroupId = (typeof NOTIFICATION_TRIGGER_GROUPS)[number]["id"];

export type NotificationTriggerDefinition = {
  id: string;
  group: NotificationTriggerGroupId;
  name: string;
  description: string;
  defaultEnabled: boolean;
};

export type NotificationTrigger = NotificationTriggerDefinition & {
  enabled: boolean;
};

/**
 * Starter master list. Replace ids and names when the lab provides the exact catalog.
 * Settings are stored by `id`; renaming a label is safe, changing an id is not.
 */
export const NOTIFICATION_TRIGGERS: NotificationTriggerDefinition[] = [
  {
    id: "order_booked",
    group: "common",
    name: "Order booked",
    description: "Patient completed a booking.",
    defaultEnabled: true,
  },
  {
    id: "sample_collected",
    group: "common",
    name: "Sample collected",
    description: "The lab has the sample.",
    defaultEnabled: true,
  },
  {
    id: "results_ready",
    group: "common",
    name: "Results ready",
    description: "Reports are available to the patient.",
    defaultEnabled: true,
  },
  {
    id: "feedback_requested",
    group: "common",
    name: "Feedback",
    description: "Ask the patient for feedback after the visit.",
    defaultEnabled: true,
  },
  {
    id: "walk_in_registered",
    group: "self_registration",
    name: "Walk-in registered",
    description: "Patient registered at the lab counter.",
    defaultEnabled: true,
  },
  {
    id: "appointment_scheduled",
    group: "appointment",
    name: "Appointment scheduled",
    description: "A lab visit slot is confirmed.",
    defaultEnabled: true,
  },
  {
    id: "appointment_reminder",
    group: "appointment",
    name: "Appointment reminder",
    description: "Remind the patient before the slot.",
    defaultEnabled: true,
  },
  {
    id: "appointment_completed",
    group: "appointment",
    name: "Appointment completed",
    description: "The lab visit is finished.",
    defaultEnabled: true,
  },
  {
    id: "home_visit_scheduled",
    group: "home_collection",
    name: "Visit scheduled",
    description: "The phlebotomist assigned a visit time.",
    defaultEnabled: true,
  },
  {
    id: "phlebotomist_on_the_way",
    group: "home_collection",
    name: "Phlebotomist on the way",
    description: "Remind the patient the collector is coming.",
    defaultEnabled: true,
  },
  {
    id: "phlebotomist_on_site",
    group: "home_collection",
    name: "Phlebotomist on site",
    description: "The collector has arrived.",
    defaultEnabled: true,
  },
  {
    id: "kit_shipped",
    group: "kit",
    name: "Kit shipped",
    description: "The self-collection kit is on its way.",
    defaultEnabled: true,
  },
  {
    id: "kit_delivered",
    group: "kit",
    name: "Kit delivered",
    description: "The kit reached the patient.",
    defaultEnabled: true,
  },
  {
    id: "kit_received",
    group: "kit",
    name: "Kit received at lab",
    description: "The returned kit arrived at the lab.",
    defaultEnabled: true,
  },
];

const TRIGGER_IDS = new Set(NOTIFICATION_TRIGGERS.map((trigger) => trigger.id));

export function isNotificationTriggerId(value: string) {
  return TRIGGER_IDS.has(value);
}

export function mergeNotificationTriggers(
  settings: Iterable<{ triggerId: string; enabled: boolean }>,
): NotificationTrigger[] {
  const enabledById = new Map<string, boolean>();
  for (const row of settings) {
    enabledById.set(row.triggerId, row.enabled);
  }

  return NOTIFICATION_TRIGGERS.map((trigger) => ({
    ...trigger,
    enabled: enabledById.get(trigger.id) ?? trigger.defaultEnabled,
  }));
}

export function groupNotificationTriggers(triggers: NotificationTrigger[]) {
  return NOTIFICATION_TRIGGER_GROUPS.map((group) => ({
    ...group,
    triggers: triggers.filter((trigger) => trigger.group === group.id),
  })).filter((group) => group.triggers.length > 0);
}
