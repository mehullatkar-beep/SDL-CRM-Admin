"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveBanner } from "@/actions/banners";
import { AdminPageBody } from "@/components/admin-page-body";
import { BannerImageField } from "@/components/banners/banner-image-field";
import { BannerPreviews } from "@/components/banners/banner-previews";
import { SwitchFieldRow } from "@/components/switch-field-row";
import { ViewOnlyNotice } from "@/components/view-only-notice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { emptyBannerForm, validateBannerForm, type BannerFormValues } from "@/lib/banner-form";

export function BannerForm({
  canEdit,
  initial,
}: {
  canEdit: boolean;
  initial?: BannerFormValues;
}) {
  const router = useRouter();
  const [values, setValues] = useState<BannerFormValues>(initial ?? emptyBannerForm());
  const [pending, startTransition] = useTransition();

  function patch(partial: Partial<BannerFormValues>) {
    setValues((current) => ({ ...current, ...partial }));
  }

  function submit() {
    if (!canEdit) return;
    const error = validateBannerForm(values);
    if (error) {
      toast.error(error);
      return;
    }

    startTransition(async () => {
      const result = await saveBanner({
        id: values.id,
        name: values.name,
        headline: values.headline,
        body: values.body,
        imageUrl: values.imageUrl,
        linkUrl: values.linkUrl,
        showOnHome: values.showOnHome,
        showInNotifications: values.showInNotifications,
        sortOrder: values.sortOrder,
        validFrom: values.validFrom || null,
        validTo: values.validTo || null,
      });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(values.id ? "Banner saved." : "Banner created.");
      router.push("/banners");
      router.refresh();
    });
  }

  return (
    <AdminPageBody className="py-4 lg:py-5">
      <form
        method="post"
        className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="space-y-6">
          {!canEdit ? <ViewOnlyNotice /> : null}

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Announcement</CardTitle>
              <CardDescription>
                Name is for staff only. Headline and body are what patients see when you include
                copy.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="bannerName">Name</Label>
                <Input
                  id="bannerName"
                  value={values.name}
                  disabled={!canEdit}
                  placeholder="Diwali 2026"
                  onChange={(event) => patch({ name: event.target.value })}
                />
              </div>
              <BannerImageField
                url={values.imageUrl}
                canEdit={canEdit}
                disabled={pending}
                onChange={(imageUrl) => patch({ imageUrl })}
              />
              <div className="space-y-2">
                <Label htmlFor="bannerHeadline">Headline</Label>
                <Input
                  id="bannerHeadline"
                  value={values.headline}
                  disabled={!canEdit}
                  placeholder="Inbox title, or home text when there is no image"
                  onChange={(event) => patch({ headline: event.target.value })}
                />
                <p className="text-muted-foreground text-xs">
                  {values.imageUrl
                    ? "Not shown on the home banner when an image is set. Used for the inbox row."
                    : "Shown on home when there is no image, and on the inbox row."}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bannerBody">Body (optional)</Label>
                <Textarea
                  id="bannerBody"
                  rows={3}
                  value={values.body}
                  disabled={!canEdit}
                  placeholder="Optional details for a text banner or inbox row"
                  onChange={(event) => patch({ body: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bannerLinkUrl">Link URL (optional)</Label>
                <Input
                  id="bannerLinkUrl"
                  value={values.linkUrl}
                  disabled={!canEdit}
                  placeholder="https:// or /p/package-slug"
                  onChange={(event) => patch({ linkUrl: event.target.value })}
                />
                <p className="text-muted-foreground text-xs">
                  Leave empty for display-only. Use an https URL or a path starting with /.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Placement</CardTitle>
              <CardDescription>
                Choose where this announcement appears in the patient app. Email and SMS templates
                stay in Portal → Notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <SwitchFieldRow
                id="showOnHome"
                label="Home banner"
                description="Carousel strip on the patient app home. An image is shown on its own with no text overlay."
                checked={values.showOnHome}
                disabled={!canEdit}
                onCheckedChange={(showOnHome) => patch({ showOnHome })}
              />
              <SwitchFieldRow
                id="showInNotifications"
                label="In-app notification"
                description="Row in the patient app notifications list. Needs a headline."
                checked={values.showInNotifications}
                disabled={!canEdit}
                onCheckedChange={(showInNotifications) => patch({ showInNotifications })}
              />
              {values.showOnHome ? (
                <div className="space-y-2">
                  <Label htmlFor="bannerSortOrder">Home sort order</Label>
                  <Input
                    id="bannerSortOrder"
                    type="number"
                    value={values.sortOrder}
                    disabled={!canEdit}
                    onChange={(event) =>
                      patch({ sortOrder: Math.trunc(Number(event.target.value) || 0) })
                    }
                  />
                  <p className="text-muted-foreground text-xs">Lower numbers appear first.</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Schedule</CardTitle>
              <CardDescription>
                Leave dates empty for an open-ended announcement. There is no pause switch —
                archive to take it off the app.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bannerValidFrom">Valid from</Label>
                <Input
                  id="bannerValidFrom"
                  type="date"
                  value={values.validFrom}
                  disabled={!canEdit}
                  onChange={(event) => patch({ validFrom: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bannerValidTo">Valid to</Label>
                <Input
                  id="bannerValidTo"
                  type="date"
                  value={values.validTo}
                  disabled={!canEdit}
                  onChange={(event) => patch({ validTo: event.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push("/banners")}>
              Cancel
            </Button>
            {canEdit ? (
              <Button type="submit" disabled={pending}>
                {values.id ? "Save banner" : "Create banner"}
              </Button>
            ) : null}
          </div>
        </div>

        <BannerPreviews values={values} />
      </form>
    </AdminPageBody>
  );
}
