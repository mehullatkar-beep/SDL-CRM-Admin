export type GenderRestriction = "any" | "male" | "female";

export type MasterTest = {
  id: string;
  code: string;
  name: string;
  department: string;
  sampleType: string;
  turnaroundHours: number;
  listPrice: number;
  requiresPhysicianOrder: boolean;
  genderRestriction: GenderRestriction;
  minAge: number | null;
  maxAge: number | null;
  defaultPrepNotes: string;
};

export type ListTestsQuery = {
  query?: string;
  sampleType?: string;
  department?: string;
};

export interface LabMasterClient {
  listTests(query?: ListTestsQuery): Promise<MasterTest[]>;
  getTest(masterId: string): Promise<MasterTest | null>;
}
