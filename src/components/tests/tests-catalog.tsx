"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Search, SearchX } from "lucide-react";
import { saveTestBookingConfig } from "@/actions/tests";
import { DataTableShell } from "@/components/data-table-shell";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { SwitchFieldRow } from "@/components/switch-field-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatMoney } from "@/lib/catalog";
import type { CatalogTest } from "@/lib/catalog-queries";
import type { GenderRestriction } from "@/lib/lab-master";
import { ViewOnlyNotice } from "@/components/view-only-notice";

function bookingStatus(test: CatalogTest) {
  if (test.booking?.patientBookable && test.booking.active) return "bookable";
  if (test.booking && !test.booking.active) return "inactive";
  return "not-configured";
}

export function TestsCatalog({ tests, canEdit }: { tests: CatalogTest[]; canEdit: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<CatalogTest | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [pending, startTransition] = useTransition();

  const departments = useMemo(
    () => Array.from(new Set(tests.map((test) => test.department))).sort(),
    [tests],
  );
  const sampleTypes = useMemo(
    () => Array.from(new Set(tests.map((test) => test.sampleType))).sort(),
    [tests],
  );

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") params.delete(key);
    else params.set(key, value);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <>
      <DataTableShell
        toolbar={
          <form
            className="grid gap-3 md:grid-cols-4"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              updateFilter("q", String(form.get("q") ?? ""));
            }}
          >
            <div className="flex gap-2 md:col-span-2">
              <Label htmlFor="q" className="sr-only">
                Search
              </Label>
              <div className="relative min-w-0 flex-1">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  id="q"
                  name="q"
                  placeholder="Search by name, code, or department"
                  defaultValue={searchParams.get("q") ?? ""}
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="outline">
                Search
              </Button>
            </div>
            <Select
              value={searchParams.get("department") ?? "all"}
              onValueChange={(value) => updateFilter("department", value)}
            >
              <SelectTrigger aria-label="Filter by department">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {departments.map((department) => (
                  <SelectItem key={department} value={department}>
                    {department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={searchParams.get("sampleType") ?? "all"}
              onValueChange={(value) => updateFilter("sampleType", value)}
            >
              <SelectTrigger aria-label="Filter by sample type">
                <SelectValue placeholder="Sample type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All samples</SelectItem>
                {sampleTypes.map((sampleType) => (
                  <SelectItem key={sampleType} value={sampleType}>
                    {sampleType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </form>
        }
      >
        {tests.length === 0 ? (
          <EmptyState
            icon={<SearchX className="size-5" />}
            title="No tests match these filters"
            description="Clear the search or choose a different department and sample type."
            action={
              <Button variant="outline" onClick={() => router.push(pathname)}>
                Reset filters
              </Button>
            }
          />
        ) : (
          <Table className="min-w-[920px]">
            <TableHeader className="bg-muted/35">
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Sample</TableHead>
                <TableHead>List price</TableHead>
                <TableHead>Physician order</TableHead>
                <TableHead>Booking</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tests.map((test) => {
                const status = bookingStatus(test);
                return (
                  <TableRow key={test.id}>
                    <TableCell className="pl-4 font-mono text-xs text-muted-foreground">
                      {test.code}
                    </TableCell>
                    <TableCell className="max-w-64 font-medium">{test.name}</TableCell>
                    <TableCell>{test.department}</TableCell>
                    <TableCell>{test.sampleType}</TableCell>
                    <TableCell>{formatMoney(test.listPrice)}</TableCell>
                    <TableCell>{test.requiresPhysicianOrder ? "Required" : "No"}</TableCell>
                    <TableCell>
                      {status === "bookable" ? (
                        <StatusBadge tone="success">Patient bookable</StatusBadge>
                      ) : status === "inactive" ? (
                        <StatusBadge>Inactive</StatusBadge>
                      ) : (
                        <StatusBadge tone="outline">Not configured</StatusBadge>
                      )}
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelected(test)}>
                        {canEdit ? "Configure" : "View"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </DataTableShell>

      <BookingConfigSheet
        test={selected}
        canEdit={canEdit}
        pending={pending}
        onClose={() => setSelected(null)}
        onRequestDeactivate={() => setConfirmDeactivate(true)}
        onSave={(payload, deactivate) => {
          if (deactivate) {
            setConfirmDeactivate(true);
            return;
          }
          startTransition(async () => {
            const result = await saveTestBookingConfig(payload);
            if (result.error) {
              toast.error(result.error);
              return;
            }
            toast.success("Booking configuration saved.");
            setSelected(null);
            router.refresh();
          });
        }}
      />

      <AlertDialog open={confirmDeactivate} onOpenChange={setConfirmDeactivate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Turn off patient booking?</AlertDialogTitle>
            <AlertDialogDescription>
              {selected?.name} will no longer be offered for patient self-booking. You can enable it
              again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!selected) return;
                startTransition(async () => {
                  const result = await saveTestBookingConfig({
                    masterTestId: selected.id,
                    patientBookable: false,
                    physicianOrderRequired:
                      selected.booking?.physicianOrderRequired ?? selected.requiresPhysicianOrder,
                    prepInstructions:
                      selected.booking?.prepInstructions ?? selected.defaultPrepNotes,
                    minAge: selected.booking?.minAge ?? selected.minAge,
                    maxAge: selected.booking?.maxAge ?? selected.maxAge,
                    genderRestriction: (selected.booking?.genderRestriction ??
                      selected.genderRestriction) as GenderRestriction,
                    homeCollectionAllowed: selected.booking?.homeCollectionAllowed ?? false,
                    notesForPatient: selected.booking?.notesForPatient ?? "",
                    active: false,
                  });
                  if (result.error) {
                    toast.error(result.error);
                    return;
                  }
                  toast.success("Patient booking disabled.");
                  setConfirmDeactivate(false);
                  setSelected(null);
                  router.refresh();
                });
              }}
            >
              Disable booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function BookingConfigSheet({
  test,
  canEdit,
  pending,
  onClose,
  onSave,
  onRequestDeactivate,
}: {
  test: CatalogTest | null;
  canEdit: boolean;
  pending: boolean;
  onClose: () => void;
  onRequestDeactivate: () => void;
  onSave: (
    payload: Parameters<typeof saveTestBookingConfig>[0],
    deactivate: boolean,
  ) => void;
}) {
  return (
    <Sheet open={Boolean(test)} onOpenChange={(next) => !next && onClose()}>
      {test ? (
        <BookingConfigFields
          key={test.id}
          test={test}
          canEdit={canEdit}
          pending={pending}
          onSave={onSave}
          onRequestDeactivate={onRequestDeactivate}
        />
      ) : null}
    </Sheet>
  );
}

function BookingConfigFields({
  test,
  canEdit,
  pending,
  onSave,
  onRequestDeactivate,
}: {
  test: CatalogTest;
  canEdit: boolean;
  pending: boolean;
  onRequestDeactivate: () => void;
  onSave: (
    payload: Parameters<typeof saveTestBookingConfig>[0],
    deactivate: boolean,
  ) => void;
}) {
  const [patientBookable, setPatientBookable] = useState(test.booking?.patientBookable ?? false);
  const [physicianOrderRequired, setPhysicianOrderRequired] = useState(
    test.booking?.physicianOrderRequired ?? test.requiresPhysicianOrder,
  );
  const [homeCollectionAllowed, setHomeCollectionAllowed] = useState(
    test.booking?.homeCollectionAllowed ?? false,
  );
  const [prepInstructions, setPrepInstructions] = useState(
    test.booking?.prepInstructions ?? test.defaultPrepNotes,
  );
  const [notesForPatient, setNotesForPatient] = useState(test.booking?.notesForPatient ?? "");
  const [minAge, setMinAge] = useState(String(test.booking?.minAge ?? test.minAge ?? ""));
  const [maxAge, setMaxAge] = useState(String(test.booking?.maxAge ?? test.maxAge ?? ""));
  const [genderRestriction, setGenderRestriction] = useState<GenderRestriction>(
    (test.booking?.genderRestriction ?? test.genderRestriction) as GenderRestriction,
  );

  function parseAge(value: string) {
    if (value.trim() === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  return (
    <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{test.name}</SheetTitle>
          <SheetDescription>
            Overlay on lab master {test.code}. Master data is read-only.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4">
            <SwitchFieldRow
              id="patientBookable"
              label="Patient bookable"
              description="Show this test on the future portal."
              checked={patientBookable}
              onCheckedChange={setPatientBookable}
              disabled={!canEdit}
            />
            <SwitchFieldRow
              id="physicianOrderRequired"
              label="Physician order required"
              description={`Master default: ${test.requiresPhysicianOrder ? "yes" : "no"}`}
              checked={physicianOrderRequired}
              onCheckedChange={setPhysicianOrderRequired}
              disabled={!canEdit}
            />
            <SwitchFieldRow
              id="homeCollectionAllowed"
              label="Home collection allowed"
              description="Allow a phlebotomist to collect this sample at home."
              checked={homeCollectionAllowed}
              onCheckedChange={setHomeCollectionAllowed}
              disabled={!canEdit}
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="minAge">Min age</Label>
                <Input
                  id="minAge"
                  inputMode="numeric"
                  value={minAge}
                  onChange={(event) => setMinAge(event.target.value)}
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxAge">Max age</Label>
                <Input
                  id="maxAge"
                  inputMode="numeric"
                  value={maxAge}
                  onChange={(event) => setMaxAge(event.target.value)}
                  disabled={!canEdit}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Gender restriction</Label>
              <Select
                value={genderRestriction}
                onValueChange={(value) => setGenderRestriction(value as GenderRestriction)}
                disabled={!canEdit}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prep">Preparation instructions</Label>
              <Textarea
                id="prep"
                rows={4}
                value={prepInstructions}
                onChange={(event) => setPrepInstructions(event.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes for patient</Label>
              <Textarea
                id="notes"
                rows={3}
                value={notesForPatient}
                onChange={(event) => setNotesForPatient(event.target.value)}
                disabled={!canEdit}
              />
            </div>
          </div>
        <SheetFooter className="border-t bg-muted/20">
          {canEdit && test?.booking?.patientBookable ? (
            <Button type="button" variant="destructive" onClick={onRequestDeactivate}>
              Disable booking
            </Button>
          ) : null}
          {canEdit ? (
            <Button
              type="button"
              disabled={pending || !test}
              onClick={() => {
                if (!test) return;
                onSave(
                  {
                    masterTestId: test.id,
                    patientBookable,
                    physicianOrderRequired,
                    prepInstructions,
                    minAge: parseAge(minAge),
                    maxAge: parseAge(maxAge),
                    genderRestriction,
                    homeCollectionAllowed,
                    notesForPatient,
                    active: true,
                  },
                  false,
                );
              }}
            >
              {pending ? "Saving…" : "Save configuration"}
            </Button>
          ) : (
            <ViewOnlyNotice />
          )}
        </SheetFooter>
    </SheetContent>
  );
}
