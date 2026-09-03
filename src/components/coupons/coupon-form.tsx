"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveCoupon } from "@/actions/coupons";
import { AdminPageBody } from "@/components/admin-page-body";
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
import { formatMoney } from "@/lib/catalog";
import {
  emptyCouponForm,
  parseOptionalPositiveInt,
  validateCouponForm,
  type CouponFormValues,
} from "@/lib/coupon-form";
import {
  COUPON_FAILURE_COPY,
  evaluateCoupon,
  generateCouponCode,
  normalizeCouponCode,
  type CouponDiscountType,
} from "@/lib/coupons";

export function CouponForm({
  canEdit,
  initial,
}: {
  canEdit: boolean;
  initial?: CouponFormValues;
}) {
  const router = useRouter();
  const [values, setValues] = useState<CouponFormValues>(initial ?? emptyCouponForm());
  const [pending, startTransition] = useTransition();

  function patch(partial: Partial<CouponFormValues>) {
    setValues((current) => ({ ...current, ...partial }));
  }

  const preview = useMemo(
    () =>
      evaluateCoupon({
        coupon: {
          code: normalizeCouponCode(values.code) || "PREVIEW",
          discountType: values.discountType,
          discountValue: values.discountValue,
          maxDiscountAmount: values.discountType === "percent" ? values.maxDiscountAmount : null,
          minCartAmount: values.minCartAmount,
          validFrom: values.validFrom || null,
          validTo: values.validTo || null,
          maxRedemptions: values.maxRedemptions,
          redemptionCount: 0,
          active: true,
          archived: false,
        },
        cartSubtotalMajor: values.previewCartAmount,
      }),
    [values],
  );

  function submit() {
    if (!canEdit) return;
    const error = validateCouponForm(values);
    if (error) {
      toast.error(error);
      return;
    }

    startTransition(async () => {
      const result = await saveCoupon({
        id: values.id,
        name: values.name,
        code: values.code,
        description: values.description,
        discountType: values.discountType,
        discountValue: values.discountValue,
        maxDiscountAmount: values.discountType === "percent" ? values.maxDiscountAmount : null,
        minCartAmount: values.minCartAmount,
        validFrom: values.validFrom || null,
        validTo: values.validTo || null,
        maxRedemptions: values.maxRedemptions,
        maxPerPatient: values.maxPerPatient,
      });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(values.id ? "Coupon saved." : "Coupon created.");
      router.push("/coupons");
      router.refresh();
    });
  }

  return (
    <AdminPageBody className="py-4 lg:py-5">
      <form
        method="post"
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        {!canEdit ? <ViewOnlyNotice /> : null}

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Identity</CardTitle>
            <CardDescription>
              Patients will enter the code at a future checkout. Codes are stored in uppercase.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="couponName">Name</Label>
              <Input
                id="couponName"
                value={values.name}
                disabled={!canEdit}
                placeholder="Ramadan wellness"
                onChange={(event) => patch({ name: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="couponCode">Code</Label>
              <div className="flex gap-2">
                <Input
                  id="couponCode"
                  value={values.code}
                  disabled={!canEdit}
                  placeholder="WELCOME10"
                  className="font-mono uppercase"
                  onChange={(event) => patch({ code: normalizeCouponCode(event.target.value) })}
                />
                {canEdit ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => patch({ code: generateCouponCode() })}
                  >
                    Generate
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="couponDescription">Patient-facing description (optional)</Label>
              <Textarea
                id="couponDescription"
                rows={3}
                value={values.description}
                disabled={!canEdit}
                placeholder="10% off your booking this month."
                onChange={(event) => patch({ description: event.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Discount</CardTitle>
            <CardDescription>
              Applies to the cart subtotal after package offer prices. Fulfillment fees are not
              discounted.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="discountValue">Discount</Label>
              <div className="flex gap-2">
                <Select
                  value={values.discountType}
                  disabled={!canEdit}
                  onValueChange={(value) =>
                    patch({
                      discountType: value as CouponDiscountType,
                      maxDiscountAmount: value === "fixed" ? null : values.maxDiscountAmount,
                    })
                  }
                >
                  <SelectTrigger className="w-[9.5rem] shrink-0" aria-label="Discount type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percent</SelectItem>
                    <SelectItem value="fixed">Fixed amount</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="discountValue"
                  type="number"
                  min={1}
                  max={values.discountType === "percent" ? 100 : undefined}
                  value={values.discountValue}
                  disabled={!canEdit}
                  onChange={(event) =>
                    patch({ discountValue: Math.max(0, Math.trunc(Number(event.target.value) || 0)) })
                  }
                />
              </div>
            </div>
            {values.discountType === "percent" ? (
              <div className="space-y-2">
                <Label htmlFor="maxDiscountAmount">Max discount (optional)</Label>
                <Input
                  id="maxDiscountAmount"
                  type="number"
                  min={1}
                  placeholder="No cap"
                  value={values.maxDiscountAmount ?? ""}
                  disabled={!canEdit}
                  onChange={(event) =>
                    patch({ maxDiscountAmount: parseOptionalPositiveInt(event.target.value) })
                  }
                />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="minCartAmount">Minimum cart amount</Label>
              <Input
                id="minCartAmount"
                type="number"
                min={0}
                value={values.minCartAmount}
                disabled={!canEdit}
                onChange={(event) =>
                  patch({ minCartAmount: Math.max(0, Math.trunc(Number(event.target.value) || 0)) })
                }
              />
              <p className="text-muted-foreground text-xs">0 means no minimum.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Schedule and limits</CardTitle>
            <CardDescription>
              Redemption counts stay at zero until checkout records usage. Per-patient max is stored
              for that later step.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="couponValidFrom">Valid from</Label>
              <Input
                id="couponValidFrom"
                type="date"
                value={values.validFrom}
                disabled={!canEdit}
                onChange={(event) => patch({ validFrom: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="couponValidTo">Valid to</Label>
              <Input
                id="couponValidTo"
                type="date"
                value={values.validTo}
                disabled={!canEdit}
                onChange={(event) => patch({ validTo: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxRedemptions">Max redemptions (optional)</Label>
              <Input
                id="maxRedemptions"
                type="number"
                min={1}
                placeholder="Unlimited"
                value={values.maxRedemptions ?? ""}
                disabled={!canEdit}
                onChange={(event) =>
                  patch({ maxRedemptions: parseOptionalPositiveInt(event.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxPerPatient">Max per patient</Label>
              <Input
                id="maxPerPatient"
                type="number"
                min={1}
                value={values.maxPerPatient}
                disabled={!canEdit}
                onChange={(event) =>
                  patch({ maxPerPatient: Math.max(1, Math.trunc(Number(event.target.value) || 1)) })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              Same math checkout will use. Fees are not included.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="previewCartAmount">Example cart subtotal</Label>
              <Input
                id="previewCartAmount"
                type="number"
                min={0}
                value={values.previewCartAmount}
                onChange={(event) =>
                  patch({
                    previewCartAmount: Math.max(0, Math.trunc(Number(event.target.value) || 0)),
                  })
                }
              />
            </div>
            <div className="bg-primary/5 rounded-lg border border-primary/15 p-4">
              {preview.ok ? (
                <>
                  <p className="text-sm font-medium">
                    Saves{" "}
                    <span className="ml-1 text-lg font-semibold">
                      {formatMoney(preview.discountMajor)}
                    </span>
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Patient pays {formatMoney(preview.payableMajor)} before fees.
                  </p>
                </>
              ) : (
                <p className="text-sm">{COUPON_FAILURE_COPY[preview.reason]}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.push("/coupons")}>
            Cancel
          </Button>
          {canEdit ? (
            <Button type="submit" disabled={pending}>
              {values.id ? "Save coupon" : "Create coupon"}
            </Button>
          ) : null}
        </div>
      </form>
    </AdminPageBody>
  );
}
