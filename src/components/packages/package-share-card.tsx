"use client";

import { useState } from "react";
import { Check, Copy, Download, Link2, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/catalog";
import { packageSharePath, packageShareUrl } from "@/lib/package-share";

function absoluteShareUrl(shareSlug: string) {
  const path = packageSharePath(shareSlug);
  if (typeof window === "undefined") return path;
  return packageShareUrl(
    shareSlug,
    process.env.NEXT_PUBLIC_PATIENT_PORTAL_ORIGIN || window.location.origin,
  );
}

export function PackageShareCard({
  name,
  slug,
  saved,
}: {
  name: string;
  slug: string;
  saved: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const shareSlug = slugify(slug || name);
  const url = shareSlug ? absoluteShareUrl(shareSlug) : "";

  async function copy() {
    if (!shareSlug) return;
    const nextUrl = absoluteShareUrl(shareSlug);
    try {
      await navigator.clipboard.writeText(nextUrl);
      setCopied(true);
      toast.success("Link copied.");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy the link.");
    }
  }

  async function downloadQr() {
    if (!shareSlug) return;
    const nextUrl = absoluteShareUrl(shareSlug);
    setDownloading(true);
    try {
      const dataUrl = await QRCode.toDataURL(nextUrl, {
        width: 512,
        margin: 2,
        color: { dark: "#111827", light: "#ffffff" },
      });
      const anchor = document.createElement("a");
      anchor.href = dataUrl;
      anchor.download = `${shareSlug || "package"}-qr.png`;
      anchor.click();
    } catch {
      toast.error("Could not generate the QR code.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Link2 className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            readOnly
            suppressHydrationWarning
            value={url || "Add a package name to generate a link"}
            className="pl-9"
          />
        </div>
        <Button type="button" variant="outline" onClick={copy} disabled={!shareSlug}>
          {copied ? <Check /> : <Copy />}
          Copy
        </Button>
      </div>
      <Button type="button" variant="outline" onClick={downloadQr} disabled={!shareSlug || downloading}>
        {downloading ? <QrCode /> : <Download />}
        {downloading ? "Preparing QR…" : "Download QR"}
      </Button>
      <p className="text-muted-foreground text-xs">
        {saved
          ? "Share this link or QR wherever you promote the package."
          : "The link is reserved when you create the package. Copy and QR still use this URL."}
      </p>
    </div>
  );
}
