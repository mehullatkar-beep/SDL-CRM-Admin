export const FULFILLMENT_MODES = [
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
    id: "appointment_home_collection",
    label: "Appointment & home collection",
    description: "Patient can book a lab visit or home collection.",
  },
  {
    id: "kit",
    label: "Kit",
    description: "A self-collection kit is shipped to the patient.",
  },
] as const;

export type FulfillmentMode = (typeof FULFILLMENT_MODES)[number]["id"];

export function isFulfillmentMode(value: string): value is FulfillmentMode {
  return FULFILLMENT_MODES.some((mode) => mode.id === value);
}

export function fulfillmentFeeFlags(mode: FulfillmentMode) {
  return {
    homeCollection: mode === "home_collection" || mode === "appointment_home_collection",
    consultation: mode === "appointment" || mode === "appointment_home_collection",
    shipping: mode === "kit",
  };
}
