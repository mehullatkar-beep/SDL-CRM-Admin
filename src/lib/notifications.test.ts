import { describe, expect, it } from "vitest";
import {
  groupNotificationTriggers,
  isNotificationTriggerId,
  mergeNotificationTriggers,
  NOTIFICATION_TRIGGERS,
} from "./notification-triggers";

describe("notification triggers", () => {
  it("defaults missing settings to on", () => {
    const merged = mergeNotificationTriggers([]);
    expect(merged).toHaveLength(NOTIFICATION_TRIGGERS.length);
    expect(merged.every((trigger) => trigger.enabled)).toBe(true);
  });

  it("applies stored off switches and ignores unknown ids", () => {
    const merged = mergeNotificationTriggers([
      { triggerId: "results_ready", enabled: false },
      { triggerId: "retired_trigger", enabled: false },
    ]);
    expect(merged.find((trigger) => trigger.id === "results_ready")?.enabled).toBe(false);
    expect(merged.find((trigger) => trigger.id === "order_booked")?.enabled).toBe(true);
    expect(merged.some((trigger) => trigger.id === "retired_trigger")).toBe(false);
  });

  it("keeps common events in one group ahead of fulfillment-specific events", () => {
    const groups = groupNotificationTriggers(mergeNotificationTriggers([]));
    expect(groups.map((group) => group.id)).toEqual([
      "common",
      "self_registration",
      "appointment",
      "home_collection",
      "kit",
    ]);
    expect(groups[0]?.triggers.map((trigger) => trigger.id)).toEqual([
      "order_booked",
      "sample_collected",
      "results_ready",
      "feedback_requested",
    ]);
  });

  it("accepts only catalog ids", () => {
    expect(isNotificationTriggerId("order_booked")).toBe(true);
    expect(isNotificationTriggerId("retired_trigger")).toBe(false);
  });
});
