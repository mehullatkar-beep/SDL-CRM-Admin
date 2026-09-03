import { createHttpLabMasterClient } from "./http-client";
import { createFailingLabMasterClient, createMockLabMasterClient } from "./mock-client";
import { isManagedProduction } from "@/lib/env";
import type { LabMasterClient } from "./types";

export type { GenderRestriction, LabMasterClient, ListTestsQuery, MasterTest } from "./types";

export function getLabMasterClient(options?: { simulateError?: boolean }): LabMasterClient {
  const managedProduction = isManagedProduction();
  if (!managedProduction && (options?.simulateError || process.env.LAB_MASTER_FAIL === "true")) {
    return createFailingLabMasterClient();
  }

  const provider = process.env.LAB_MASTER_PROVIDER ?? "mock";
  if (provider === "http") {
    const baseUrl = process.env.LAB_MASTER_API_URL;
    const token = process.env.LAB_MASTER_API_TOKEN;
    const publicKey = process.env.LAB_MASTER_LAB_PUBLIC_KEY;
    if (!baseUrl) {
      throw new Error("LAB_MASTER_API_URL is required when LAB_MASTER_PROVIDER=http.");
    }
    if (!token) {
      throw new Error("LAB_MASTER_API_TOKEN is required when LAB_MASTER_PROVIDER=http.");
    }
    if (!publicKey) {
      throw new Error("LAB_MASTER_LAB_PUBLIC_KEY is required when LAB_MASTER_PROVIDER=http.");
    }
    return createHttpLabMasterClient({ baseUrl, token, publicKey });
  }

  if (managedProduction) {
    throw new Error("LAB_MASTER_PROVIDER=http is required in production.");
  }

  return createMockLabMasterClient();
}
