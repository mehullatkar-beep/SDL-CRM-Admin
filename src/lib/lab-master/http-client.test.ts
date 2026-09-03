import { afterEach, describe, expect, it, vi } from "vitest";
import { createHttpLabMasterClient } from "./http-client";

const crelioTest = {
  id: 1,
  code: "CBC",
  name: "Complete Blood Count",
  department: "Hematology",
  sample_type: "Blood",
  turnaround_hours: 12,
  list_price: 120,
  gender_type: "All",
  prep_notes: "Stay hydrated.",
};

const mapped = {
  id: "1",
  code: "CBC",
  name: "Complete Blood Count",
  department: "Hematology",
  sampleType: "Blood",
  turnaroundHours: 12,
  listPrice: 120,
  requiresPhysicianOrder: false,
  genderRestriction: "any" as const,
  minAge: null,
  maxAge: null,
  defaultPrepNotes: "Stay hydrated.",
};

function listPayload(tests = [crelioTest], extras?: { has_more?: boolean; offset?: number }) {
  return {
    tests,
    total: tests.length,
    offset: extras?.offset ?? 0,
    limit: 200,
    has_more: extras?.has_more ?? false,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.LAB_MASTER_API_TOKEN;
  delete process.env.LAB_MASTER_LAB_PUBLIC_KEY;
});

describe("CrelioHealth HTTP adapter", () => {
  it("maps AllTests list responses, paginates, and sends the internal token", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify(listPayload([crelioTest], { has_more: true })), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify(
            listPayload([{ ...crelioTest, id: 2, code: "FBS", name: "Glucose" }], { offset: 200 }),
          ),
          { status: 200 },
        ),
      );

    const result = await createHttpLabMasterClient({
      baseUrl: "https://lims.example/api-v3/masters/catalog",
      token: "internal-secret",
      publicKey: "lab-public-key",
    }).listTests({
      query: "blood",
      department: "Hematology",
    });

    expect(result).toEqual([
      mapped,
      { ...mapped, id: "2", code: "FBS", name: "Glucose" },
    ]);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toContain("/catalog/tests?");
    expect(String(url)).toContain("public_key=lab-public-key");
    expect(String(url)).toContain("query=blood");
    expect(String(url)).toContain("department=Hematology");
    expect(new Headers(init?.headers).get("X-Internal-Token")).toBe("internal-secret");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("maps a single AllTests row and returns null on 404", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ test: { ...crelioTest, gender_type: "Female" } }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(new Response("missing", { status: 404 }));

    const client = createHttpLabMasterClient({
      baseUrl: "https://lims.example/api-v3/masters/catalog",
      token: "internal-secret",
      publicKey: "lab-public-key",
    });

    await expect(client.getTest("1")).resolves.toEqual({
      ...mapped,
      genderRestriction: "female",
    });
    await expect(client.getTest("missing")).resolves.toBeNull();
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/catalog/tests/1?");
  });

  it("rejects malformed vendor payloads at the integration boundary", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ tests: [{ id: "missing-fields" }] }), { status: 200 }),
    );
    await expect(
      createHttpLabMasterClient({
        baseUrl: "https://lims.example/api-v3/masters/catalog",
        token: "internal-secret",
        publicKey: "lab-public-key",
      }).listTests(),
    ).rejects.toThrow();
  });
});
