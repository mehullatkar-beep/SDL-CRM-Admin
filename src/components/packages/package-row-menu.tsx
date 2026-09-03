"use client";

import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function PackageRowMenu({
  name,
  archived,
  canEdit,
  disabled,
  triggerClassName,
  onPreview,
  onCopy,
  onArchive,
  onUnarchive,
}: {
  name: string;
  archived: boolean;
  canEdit: boolean;
  disabled?: boolean;
  triggerClassName?: string;
  onPreview: () => void;
  onCopy: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          aria-label={`Actions for ${name}`}
          className={triggerClassName}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={onPreview}>Preview</DropdownMenuItem>
        {canEdit ? (
          <>
            <DropdownMenuItem onSelect={onCopy}>Copy package</DropdownMenuItem>
            <DropdownMenuSeparator />
            {archived ? (
              <DropdownMenuItem onSelect={onUnarchive}>Unarchive</DropdownMenuItem>
            ) : (
              <DropdownMenuItem variant="destructive" onSelect={onArchive}>
                Archive
              </DropdownMenuItem>
            )}
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
