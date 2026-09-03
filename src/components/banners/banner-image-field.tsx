"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import { ImageIcon, LoaderCircle, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { uploadBannerImage } from "@/actions/banners";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_BYTES = 5 * 1024 * 1024;

export function BannerImageField({
  url,
  canEdit,
  disabled,
  onChange,
}: {
  url: string;
  canEdit: boolean;
  disabled?: boolean;
  onChange: (url: string) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const busy = !canEdit || disabled || uploading;

  async function upload(file: File | undefined) {
    if (!file || busy) return;
    if (file.size > MAX_BYTES) {
      toast.error("Banner images must be 5 MB or smaller.");
      return;
    }

    const formData = new FormData();
    formData.set("file", file);
    setUploading(true);
    try {
      const result = await uploadBannerImage(formData);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      onChange(result.url);
    } catch {
      toast.error("Could not upload the image. Try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-start gap-4">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        disabled={busy}
        onChange={(event) => upload(event.target.files?.[0])}
      />

      <label
        htmlFor={canEdit && !url ? inputId : undefined}
        onDragOver={(event) => {
          if (!canEdit) return;
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          if (!canEdit) return;
          event.preventDefault();
          setDragging(false);
          upload(event.dataTransfer.files[0]);
        }}
        className={cn(
          "relative h-16 w-28 shrink-0 overflow-hidden rounded-md border bg-muted/30",
          canEdit && !url && "cursor-pointer border-dashed hover:bg-muted/50",
          dragging && "border-primary bg-primary/5",
          uploading && "pointer-events-none opacity-70",
        )}
      >
        {url ? (
          <Image
            src={url}
            alt="Announcement image"
            fill
            unoptimized
            className="object-cover"
            sizes="112px"
          />
        ) : (
          <span className="text-muted-foreground flex h-full items-center justify-center">
            {uploading ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <ImageIcon className="size-4" />
            )}
          </span>
        )}
        {url && uploading ? (
          <span className="absolute inset-0 flex items-center justify-center bg-background/70">
            <LoaderCircle className="size-4 animate-spin" />
          </span>
        ) : null}
      </label>

      <div className="min-w-0 flex-1 space-y-2">
        <Label htmlFor={canEdit ? inputId : undefined}>Image (optional)</Label>
        <p className="text-muted-foreground text-xs leading-relaxed">
          {canEdit
            ? "JPG, PNG, or WebP, up to 5 MB. On home the image is shown without headline or body. Inbox uses it as a thumbnail."
            : url
              ? "Shown on the patient app home and inbox."
              : "Ask an administrator to add an image."}
        </p>
        {canEdit ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || uploading}
              onClick={() => inputRef.current?.click()}
            >
              <Upload />
              {url ? "Replace" : "Upload"}
            </Button>
            {url ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || uploading}
                onClick={() => onChange("")}
              >
                <Trash2 />
                Remove
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
