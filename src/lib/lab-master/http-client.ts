import type { GenderRestriction, LabMasterClient, MasterTest } from "./types";
import { z } from "zod";

const MAX_PAGES = 50;
const PAGE_LIMIT = 200;

const crelioTestSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  code: z.string().nullish(),
  name: z.string().nullish(),
  department: z.string().nullish(),
  sample_type: z.string().nullish(),
  turnaround_hours: z.number().nullish(),
  list_price: z.number().nullish(),
  gender_type: z.string().nullish(),
  prep_notes: z.string().nullish(),
});

const listResponseSchema = z.object({
  tests: z.array(crelioTestSchema),
  total: z.number().int().nonnegative(),
  offset: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  has_more: z.boolean(),
});

const detailResponseSchema = z.object({
  test: crelioTestSchema,
});

const genderMapper: Record<string, GenderRestriction> = {
  all: "any",
  male: "male",
  female: "female",
};

export type HttpLabMasterConfig = {
  baseUrl: string;
  token: string;
  publicKey: string;
  timeoutMs?: number;
};

function mapCrelioTest(row: z.infer<typeof crelioTestSchema>): MasterTest {
  const id = row.id.trim();
  const code = row.code?.trim() || id;
  const genderKey = (row.gender_type ?? "All").trim().toLowerCase();
  return {
    id,
    code,
    name: row.name?.trim() || code,
    department: row.department?.trim() || "",
    sampleType: row.sample_type?.trim() || "",
    turnaroundHours: Math.max(0, Math.round(row.turnaround_hours ?? 0)),
    listPrice: Math.max(0, Math.round(row.list_price ?? 0)),
    requiresPhysicianOrder: false,
    genderRestriction: genderMapper[genderKey] ?? "any",
    minAge: null,
    maxAge: null,
    defaultPrepNotes: row.prep_notes ?? "",
  };
}

function catalogHeaders(token: string) {
  return {
    Accept: "application/json",
    "X-Internal-Token": token,
  };
}

async function requestJson(url: URL, token: string, timeoutMs: number) {
  const attempts = 3;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: catalogHeaders(token),
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (response.ok) return response.json();
      const retryable = response.status >= 500 || response.status === 429;
      if (!retryable || attempt === attempts) {
        throw new Error(`Lab master request failed with status ${response.status}.`);
      }
    } catch (error) {
      if (attempt === attempts) throw error;
      if (error instanceof Error && error.message.includes("status ")) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 250));
  }
  throw new Error("Lab master request failed.");
}

function testsUrl(baseUrl: string) {
  return new URL("tests", `${baseUrl.replace(/\/$/, "")}/`);
}

/**
 * Adapter for CrelioHealth GET /api-v3/masters/catalog/tests.
 * Mapping from AllTests lives here so the rest of the admin sees MasterTest only.
 */
export function createHttpLabMasterClient(
  baseUrlOrConfig: string | HttpLabMasterConfig,
  maybeConfig?: Omit<HttpLabMasterConfig, "baseUrl">,
): LabMasterClient {
  const config: HttpLabMasterConfig =
    typeof baseUrlOrConfig === "string"
      ? {
          baseUrl: baseUrlOrConfig,
          token: maybeConfig?.token ?? process.env.LAB_MASTER_API_TOKEN ?? "",
          publicKey:
            maybeConfig?.publicKey ?? process.env.LAB_MASTER_LAB_PUBLIC_KEY ?? "",
          timeoutMs: maybeConfig?.timeoutMs,
        }
      : baseUrlOrConfig;

  const timeoutMs = config.timeoutMs ?? Number(process.env.LAB_MASTER_TIMEOUT_MS ?? 8000);

  function requireConfig() {
    if (!config.token) {
      throw new Error("LAB_MASTER_API_TOKEN is required when LAB_MASTER_PROVIDER=http.");
    }
    if (!config.publicKey) {
      throw new Error("LAB_MASTER_LAB_PUBLIC_KEY is required when LAB_MASTER_PROVIDER=http.");
    }
  }

  return {
    async listTests(query): Promise<MasterTest[]> {
      requireConfig();
      const tests: MasterTest[] = [];
      let offset = 0;
      for (let page = 0; page < MAX_PAGES; page += 1) {
        const url = testsUrl(config.baseUrl);
        url.searchParams.set("public_key", config.publicKey);
        url.searchParams.set("offset", String(offset));
        url.searchParams.set("limit", String(PAGE_LIMIT));
        if (query?.query) url.searchParams.set("query", query.query);
        if (query?.department) url.searchParams.set("department", query.department);
        if (query?.sampleType) url.searchParams.set("sample_type", query.sampleType);

        const payload = listResponseSchema.parse(
          await requestJson(url, config.token, timeoutMs),
        );
        tests.push(...payload.tests.map(mapCrelioTest));
        if (!payload.has_more) return tests;
        offset += payload.limit;
      }
      return tests;
    },
    async getTest(masterId): Promise<MasterTest | null> {
      requireConfig();
      const url = new URL(
        `tests/${encodeURIComponent(masterId)}`,
        `${config.baseUrl.replace(/\/$/, "")}/`,
      );
      url.searchParams.set("public_key", config.publicKey);
      try {
        const payload = detailResponseSchema.parse(
          await requestJson(url, config.token, timeoutMs),
        );
        return mapCrelioTest(payload.test);
      } catch (error) {
        if (error instanceof Error && error.message.includes("status 404")) return null;
        throw error;
      }
    },
  };
}
