"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { savePackage } from "@/actions/packages";
import { PackageBannerField } from "@/components/packages/package-banner-field";
import { PackageCategoryField } from "@/components/packages/package-category-field";
import { PackageFulfillmentField } from "@/components/packages/package-fulfillment-field";
import {
  PackagePatientPreview,
  PackageThemePicker,
} from "@/components/packages/package-patient-preview";
import { PackageShareCard } from "@/components/packages/package-share-card";
import { PACKAGE_STEPS, PackageStepper } from "@/components/packages/package-stepper";
import { PackageTestPicker } from "@/components/packages/package-test-picker";
import { SwitchFieldRow } from "@/components/switch-field-row";
import { ViewOnlyNotice } from "@/components/view-only-notice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { computeOfferPrice, formatMoney, slugify, type DiscountType } from "@/lib/catalog";
import type { CatalogTest } from "@/lib/catalog-queries";
import type { GenderRestriction } from "@/lib/lab-master";
import { fulfillmentFeeFlags, type FulfillmentMode } from "@/lib/package-fulfillment";
import {
  emptyPackageForm,
  parseOptionalInt,
  validatePackageStep,
  type PackageFormValues,
} from "@/lib/package-form";
import { normalizeHexColor, type PackageThemeId } from "@/lib/package-themes";
import { orderedSelectedTests } from "@/lib/package-summary";

export function PackageForm({
  tests,
  categories,
  canEdit,
  initial,
}: {
  tests: CatalogTest[];
  categories: string[];
  canEdit: boolean;
  initial?: PackageFormValues;
}) {
  const router = useRouter();
  const isCreate = !initial?.id;
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<PackageFormValues>(initial ?? emptyPackageForm());
  const [categoryOptions, setCategoryOptions] = useState(categories);
  const [listPriceTouched, setListPriceTouched] = useState(Boolean(initial?.id));
  const [prepTouched, setPrepTouched] = useState(Boolean(initial?.id));
  const [pending, startTransition] = useTransition();

  const selectedTests = useMemo(
    () => orderedSelectedTests(tests, values.masterTestIds),
    [tests, values.masterTestIds],
  );

  const testsSum = selectedTests.reduce((sum, test) => sum + test.listPrice, 0);
  const derivedPrep = selectedTests
    .map((test) => test.booking?.prepInstructions || test.defaultPrepNotes)
    .filter(Boolean)
    .join("\n");

  const listPrice = listPriceTouched ? values.listPrice : testsSum;
  const offerPrice = computeOfferPrice(listPrice, values.discountType, values.discountValue);
  const savings = Math.max(0, testsSum - offerPrice);
  const lastStep = PACKAGE_STEPS.length - 1;
  const stepsUnlocked = !isCreate;
  const fees = fulfillmentFeeFlags(values.fulfillmentMode);
  const shareSlug = values.slug || slugify(values.name);

  function patch(partial: Partial<PackageFormValues>) {
    setValues((current) => ({ ...current, ...partial }));
  }

  function setFulfillmentMode(fulfillmentMode: FulfillmentMode) {
    const nextFees = fulfillmentFeeFlags(fulfillmentMode);
    patch({
      fulfillmentMode,
      homeCollectionAllowed: nextFees.homeCollection,
    });
  }

  function setMasterTestIds(nextIds: string[]) {
    const nextSelected = orderedSelectedTests(tests, nextIds);
    const nextSum = nextSelected.reduce((sum, test) => sum + test.listPrice, 0);
    const nextPrep = nextSelected
      .map((test) => test.booking?.prepInstructions || test.defaultPrepNotes)
      .filter(Boolean)
      .join("\n");
    patch({
      masterTestIds: nextIds,
      listPrice: listPriceTouched ? values.listPrice : nextSum,
      prepInstructions: prepTouched ? values.prepInstructions : nextPrep,
    });
  }

  function goToStep(next: number) {
    if (next < 0 || next > lastStep) return;
    if (isCreate && next > step) {
      const error = validatePackageStep(step, { ...values, listPrice }, listPrice);
      if (error) {
        toast.error(error);
        return;
      }
    }
    setStep(next);
  }

  function submit() {
    if (!canEdit) return;
    for (let index = 0; index <= lastStep; index += 1) {
      const stepError = validatePackageStep(index, { ...values, listPrice }, listPrice);
      if (stepError) {
        toast.error(stepError);
        setStep(index);
        return;
      }
    }

    startTransition(async () => {
      const result = await savePackage({
        id: values.id,
        name: values.name,
        slug: isCreate ? undefined : values.slug,
        description: values.description,
        category: values.category,
        fulfillmentMode: values.fulfillmentMode,
        validFrom: values.validFrom || null,
        validTo: values.validTo || null,
        listPrice,
        discountType: values.discountType,
        discountValue: values.discountValue,
        eligibilityNotes: values.eligibilityNotes,
        terms: values.terms,
        cancellationPolicy: values.cancellationPolicy,
        prepInstructions: values.prepInstructions || derivedPrep,
        fastingHours: values.fastingHours,
        genderRestriction: values.genderRestriction,
        minAge: values.minAge,
        maxAge: values.maxAge,
        homeCollectionFee: fees.homeCollection ? values.homeCollectionFee : 0,
        shippingFee: fees.shipping ? values.shippingFee : 0,
        consultationFee: fees.consultation ? values.consultationFee : 0,
        bannerImageUrl: values.bannerImageUrl,
        theme: values.theme,
        customAccentHex: normalizeHexColor(values.customAccentHex),
        active: values.active,
        masterTestIds: values.masterTestIds,
      });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(values.id ? "Package saved." : "Package created.");
      if (result?.id) router.push(`/catalog/packages/${result.id}`);
    });
  }

  return (
    <form
      className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col bg-background"
      onSubmit={(event) => {
        event.preventDefault();
        if (isCreate && step !== lastStep) {
          goToStep(step + 1);
          return;
        }
        submit();
      }}
    >
      <PackageStepper
        current={step}
        onSelect={goToStep}
        canSelect={(index) => stepsUnlocked || index <= step}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
        {step === 0 ? (
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Basics</CardTitle>
              <CardDescription>Name, description, category, and how patients take this package.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={values.name}
                  disabled={!canEdit}
                  onChange={(event) => {
                    const name = event.target.value;
                    patch({
                      name,
                      slug: isCreate ? slugify(name) : values.slug,
                    });
                  }}
                />
              </div>
              <PackageCategoryField
                value={values.category}
                options={categoryOptions}
                canEdit={canEdit}
                onChange={(category, created) => {
                  patch({ category });
                  if (created && !categoryOptions.includes(category)) {
                    setCategoryOptions((current) => [...current, category].sort((a, b) => a.localeCompare(b)));
                  }
                }}
              />
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={4}
                  placeholder="What this package covers and who it is for."
                  value={values.description}
                  disabled={!canEdit}
                  onChange={(event) => patch({ description: event.target.value })}
                />
              </div>
              <PackageFulfillmentField
                value={values.fulfillmentMode}
                canEdit={canEdit}
                onChange={setFulfillmentMode}
              />
              <SwitchFieldRow
                id="packageActive"
                label="Active"
                description="Inactive packages are hidden from the future portal."
                checked={values.active}
                disabled={!canEdit}
                onCheckedChange={(active) => patch({ active })}
                className="md:col-span-2"
              />
            </CardContent>
          </Card>
        ) : null}

        {step === 1 ? (
          <div className="space-y-6">
            <Card>
              <CardHeader className="border-b">
                <CardTitle>Included tests</CardTitle>
                <CardDescription>
                  Search and add tests. Individual list prices stay visible while you set the package price.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PackageTestPicker
                  tests={tests}
                  selectedIds={values.masterTestIds}
                  canEdit={canEdit}
                  onChange={setMasterTestIds}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b">
                <CardTitle>Package price</CardTitle>
                <CardDescription>
                  Defaults to the tests sum. Discount is stored on the package. Promotional codes are managed under Coupons.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="listPrice">List price (INR)</Label>
                  <Input
                    id="listPrice"
                    type="number"
                    min={0}
                    value={listPrice}
                    disabled={!canEdit}
                    onChange={(event) => {
                      setListPriceTouched(true);
                      patch({ listPrice: Number(event.target.value) || 0 });
                    }}
                  />
                  <p className="text-muted-foreground text-xs">Tests sum: {formatMoney(testsSum)}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountValue">Discount</Label>
                  <div className="flex gap-2">
                    <Select
                      value={values.discountType}
                      disabled={!canEdit}
                      onValueChange={(value) => {
                        const discountType = value as DiscountType;
                        patch({
                          discountType,
                          discountValue: discountType === "none" ? 0 : values.discountValue,
                        });
                      }}
                    >
                      <SelectTrigger className="w-[7.25rem] shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="percent">%</SelectItem>
                        <SelectItem value="fixed">₹</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      id="discountValue"
                      type="number"
                      min={0}
                      value={values.discountValue}
                      disabled={!canEdit || values.discountType === "none"}
                      onChange={(event) => patch({ discountValue: Number(event.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="bg-primary/5 rounded-lg border border-primary/15 p-4 md:col-span-2">
                  <p className="text-sm font-medium">
                    Offer price{" "}
                    <span className="ml-1 text-lg font-semibold">{formatMoney(offerPrice)}</span>
                  </p>
                  {savings > 0 ? (
                    <p className="text-muted-foreground mt-1 text-xs">
                      Saves {formatMoney(savings)} vs a la carte
                    </p>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            {fees.homeCollection || fees.consultation || fees.shipping ? (
              <Card>
                <CardHeader className="border-b">
                  <CardTitle>Additional charges</CardTitle>
                  <CardDescription>
                    Shown for the fulfillment option chosen in Details. Nothing is charged in this slice.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  {fees.homeCollection ? (
                    <div className="space-y-2">
                      <Label htmlFor="homeFee">Home collection (INR)</Label>
                      <Input
                        id="homeFee"
                        type="number"
                        min={0}
                        value={values.homeCollectionFee}
                        disabled={!canEdit}
                        onChange={(event) =>
                          patch({ homeCollectionFee: Number(event.target.value) || 0 })
                        }
                      />
                    </div>
                  ) : null}
                  {fees.consultation ? (
                    <div className="space-y-2">
                      <Label htmlFor="consultFee">Consultation (INR)</Label>
                      <Input
                        id="consultFee"
                        type="number"
                        min={0}
                        value={values.consultationFee}
                        disabled={!canEdit}
                        onChange={(event) =>
                          patch({ consultationFee: Number(event.target.value) || 0 })
                        }
                      />
                    </div>
                  ) : null}
                  {fees.shipping ? (
                    <div className="space-y-2">
                      <Label htmlFor="shipFee">Kit shipping (INR)</Label>
                      <Input
                        id="shipFee"
                        type="number"
                        min={0}
                        value={values.shippingFee}
                        disabled={!canEdit}
                        onChange={(event) =>
                          patch({ shippingFee: Number(event.target.value) || 0 })
                        }
                      />
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-6">
            <Card>
              <CardHeader className="border-b">
                <CardTitle>Validity & Eligibility</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="validFrom">Valid from</Label>
                  <Input
                    id="validFrom"
                    type="date"
                    value={values.validFrom}
                    disabled={!canEdit}
                    onChange={(event) => patch({ validFrom: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validTo">Valid to</Label>
                  <Input
                    id="validTo"
                    type="date"
                    value={values.validTo}
                    disabled={!canEdit}
                    onChange={(event) => patch({ validTo: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fastingHours">Fasting (hours)</Label>
                  <Input
                    id="fastingHours"
                    type="number"
                    min={0}
                    placeholder="Blank if unspecified"
                    value={values.fastingHours ?? ""}
                    disabled={!canEdit}
                    onChange={(event) => patch({ fastingHours: parseOptionalInt(event.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Recommended gender</Label>
                  <Select
                    value={values.genderRestriction}
                    disabled={!canEdit}
                    onValueChange={(value) =>
                      patch({ genderRestriction: value as GenderRestriction })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="minAge">Min age</Label>
                    <Input
                      id="minAge"
                      inputMode="numeric"
                      value={values.minAge ?? ""}
                      disabled={!canEdit}
                      onChange={(event) => patch({ minAge: parseOptionalInt(event.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxAge">Max age</Label>
                    <Input
                      id="maxAge"
                      inputMode="numeric"
                      value={values.maxAge ?? ""}
                      disabled={!canEdit}
                      onChange={(event) => patch({ maxAge: parseOptionalInt(event.target.value) })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b">
                <CardTitle>Preparation and policy</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prep">Preparation</Label>
                  <Textarea
                    id="prep"
                    value={values.prepInstructions}
                    disabled={!canEdit}
                    placeholder={derivedPrep || "Defaults from selected tests"}
                    onChange={(event) => {
                      setPrepTouched(true);
                      patch({ prepInstructions: event.target.value });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="terms">Terms and conditions</Label>
                  <Textarea
                    id="terms"
                    value={values.terms}
                    disabled={!canEdit}
                    onChange={(event) => patch({ terms: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cancel">Cancellation / refund policy</Label>
                  <Textarea
                    id="cancel"
                    value={values.cancellationPolicy}
                    disabled={!canEdit}
                    onChange={(event) => patch({ cancellationPolicy: event.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
            <div className="space-y-6">
              <Card>
                <CardHeader className="border-b">
                  <CardTitle>Banner</CardTitle>
                  <CardDescription>
                    Header image patients see on the package page and in the app.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PackageBannerField
                    url={values.bannerImageUrl}
                    canEdit={canEdit}
                    disabled={pending}
                    onChange={(bannerImageUrl) => patch({ bannerImageUrl })}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="border-b">
                  <CardTitle>Theme</CardTitle>
                  <CardDescription>
                    Accent color for price, category, and the add-to-cart button.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PackageThemePicker
                    value={values.theme}
                    customHex={values.customAccentHex}
                    canEdit={canEdit}
                    onChange={(theme: PackageThemeId, customHex) =>
                      patch({
                        theme,
                        customAccentHex: customHex ?? values.customAccentHex,
                      })
                    }
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="border-b">
                  <CardTitle>Share</CardTitle>
                  <CardDescription>
                    Copy a public link or download a QR to share this package.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PackageShareCard name={values.name} slug={shareSlug} saved={Boolean(values.id)} />
                </CardContent>
              </Card>
            </div>
            <div className="lg:sticky lg:top-0">
              <p className="mb-3 text-sm font-medium">Patient preview</p>
              <p className="text-muted-foreground mb-4 text-xs">
                How this package will look live. Add to cart is a preview only.
              </p>
              <PackagePatientPreview
                values={{ ...values, listPrice }}
                selectedTests={selectedTests}
                offerPrice={offerPrice}
                listPrice={listPrice}
                savings={savings}
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="z-20 mt-auto shrink-0 border-t bg-background px-4 py-3 sm:px-6">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="outline" onClick={() => router.push("/catalog/packages")}>
            Back to list
          </Button>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
            {!canEdit ? <ViewOnlyNotice /> : null}
            {step > 0 ? (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            ) : null}
            {step < lastStep ? (
              <Button type="button" onClick={() => goToStep(step + 1)}>
                Next
              </Button>
            ) : null}
            {canEdit && (!isCreate || step === lastStep) ? (
              <Button type="submit" disabled={pending} className="sm:min-w-32">
                {pending ? "Saving…" : values.id ? "Save package" : "Create package"}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </form>
  );
}
