export const DEFERRED_MODULES = {
  orders: {
    section: "Operations",
    title: "Booked orders",
    description: "Review patient bookings, order details, and fulfillment status.",
  },
  branding: {
    section: "Portal Configurations",
    title: "Branding & Checkout",
    description: "Configure branding and checkout for the patient portal.",
  },
  feedback: {
    section: "Patient care",
    title: "Feedback",
    description: "Review patient feedback and track follow-up status.",
  },
  queries: {
    section: "Patient care",
    title: "Patient queries",
    description: "Triage patient questions, assign ownership, and manage responses.",
  },
} as const;

export type DeferredModuleKey = keyof typeof DEFERRED_MODULES;

export function isDeferredModule(value: string): value is DeferredModuleKey {
  return value in DEFERRED_MODULES;
}
