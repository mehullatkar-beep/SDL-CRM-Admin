import { MASTER_TESTS } from "./fixture";
import type { LabMasterClient, ListTestsQuery, MasterTest } from "./types";

function matchesQuery(test: MasterTest, query?: string) {
  if (!query?.trim()) return true;
  const q = query.trim().toLowerCase();
  return (
    test.name.toLowerCase().includes(q) ||
    test.code.toLowerCase().includes(q) ||
    test.department.toLowerCase().includes(q)
  );
}

export function createMockLabMasterClient(): LabMasterClient {
  return {
    async listTests(query?: ListTestsQuery) {
      return MASTER_TESTS.filter((test) => {
        if (!matchesQuery(test, query?.query)) return false;
        if (query?.department && test.department !== query.department) return false;
        if (query?.sampleType && test.sampleType !== query.sampleType) return false;
        return true;
      });
    },
    async getTest(masterId: string) {
      return MASTER_TESTS.find((test) => test.id === masterId) ?? null;
    },
  };
}

export function createFailingLabMasterClient(message = "Lab master is unavailable."): LabMasterClient {
  return {
    async listTests() {
      throw new Error(message);
    },
    async getTest() {
      throw new Error(message);
    },
  };
}
