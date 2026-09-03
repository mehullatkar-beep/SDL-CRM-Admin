export type CreateLimsOrderInput = {
  idempotencyKey: string;
  patientExternalId: string;
  masterTestIds: string[];
  fulfillmentMode:
    | "self_registration"
    | "appointment"
    | "home_collection"
    | "appointment_home_collection"
    | "kit";
  scheduledAt: string | null;
};

export type LimsOrderReference = {
  externalOrderId: string;
  status: string;
};

/**
 * Future CrelioHealth write boundary. Implement only after the vendor confirms
 * patient, order, fulfillment, idempotency, status, and webhook contracts.
 */
export interface LimsOrderClient {
  createOrder(input: CreateLimsOrderInput): Promise<LimsOrderReference>;
  getOrderStatus(externalOrderId: string): Promise<LimsOrderReference>;
}
