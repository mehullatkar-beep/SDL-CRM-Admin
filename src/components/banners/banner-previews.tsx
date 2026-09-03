"use client";

import Image from "next/image";
import { Bell } from "lucide-react";
import type { BannerFormValues } from "@/lib/banner-form";
import { cn } from "@/lib/utils";

export function BannerPreviews({ values }: { values: BannerFormValues }) {
  const headline = values.headline.trim();
  const body = values.body.trim();

  return (
    <div className="space-y-4 lg:sticky lg:top-24">
      <div className="rounded-xl border bg-card p-4">
        <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
          Home banner
        </p>
        <div
          className={cn(
            "relative overflow-hidden rounded-lg border bg-muted/40",
            values.showOnHome ? "" : "opacity-50",
          )}
        >
          {values.imageUrl ? (
            <Image
              src={values.imageUrl}
              alt=""
              width={640}
              height={144}
              unoptimized
              className="block h-36 w-full object-cover"
            />
          ) : (
            <div className="flex min-h-28 flex-col justify-center p-4">
              <p className="text-sm font-semibold">{headline || "Headline"}</p>
              <p className="text-muted-foreground mt-1 line-clamp-3 text-xs">
                {body || "Body copy appears here when there is no image."}
              </p>
            </div>
          )}
        </div>
        {!values.showOnHome ? (
          <p className="text-muted-foreground mt-2 text-xs">Not shown on home.</p>
        ) : null}
      </div>

      <div className="rounded-xl border bg-card p-4">
        <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
          In-app notification
        </p>
        <div
          className={cn(
            "flex items-start gap-3 rounded-lg border bg-background p-3",
            values.showInNotifications ? "" : "opacity-50",
          )}
        >
          {values.imageUrl ? (
            <span className="relative size-10 shrink-0 overflow-hidden rounded-md border bg-muted">
              <Image
                src={values.imageUrl}
                alt=""
                fill
                unoptimized
                className="object-cover"
                sizes="40px"
              />
            </span>
          ) : (
            <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-md">
              <Bell className="size-4" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{headline || "Headline"}</p>
            <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
              {body || "Optional body copy for the inbox row."}
            </p>
          </div>
        </div>
        {!values.showInNotifications ? (
          <p className="text-muted-foreground mt-2 text-xs">Not shown in the inbox.</p>
        ) : null}
      </div>
    </div>
  );
}
