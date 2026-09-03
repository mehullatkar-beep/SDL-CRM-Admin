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

export function CouponRowMenu({
  name,
  archived,
  canEdit,
  disabled,
  onCopy,
  onArchive,
  onUnarchive,
}: {
  name: string;
  archived: boolean;
  canEdit: boolean;
  disabled?: boolean;
  onCopy: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
}) {
  if (!canEdit) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          aria-label={`Actions for ${name}`}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={onCopy}>Copy coupon</DropdownMenuItem>
        <DropdownMenuSeparator />
        {archived ? (
          <DropdownMenuItem onSelect={onUnarchive}>Unarchive</DropdownMenuItem>
        ) : (
          <DropdownMenuItem variant="destructive" onSelect={onArchive}>
            Archive
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
