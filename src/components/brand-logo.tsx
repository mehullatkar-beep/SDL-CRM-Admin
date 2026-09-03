import Image from "next/image";
import { cn } from "@/lib/utils";
import sdlLogo from "@/assets/brand/sdl-logo.png";
import sdlMark from "@/assets/brand/sdl-mark.png";

export function BrandLogo({
  className,
  inverted = false,
  variant = "lockup",
}: {
  className?: string;
  inverted?: boolean;
  variant?: "lockup" | "full";
}) {
  if (variant === "full") {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center",
          inverted && "rounded-2xl bg-white p-3 shadow-sm",
          className,
        )}
      >
        <Image
          src={sdlLogo}
          alt="Saudi Diagnostic Limited"
          priority
          className="h-32 w-auto max-w-[13rem] object-contain"
        />
      </span>
    );
  }

  return (
    <span className={cn("flex h-10 w-full max-w-full items-center justify-center", className)}>
        <Image
          src={sdlLogo}
          alt="Saudi Diagnostic Limited"
          priority
          className="h-10 w-auto max-h-10 max-w-full object-contain object-center group-data-[collapsible=icon]:hidden"
        />
        <Image
          src={sdlMark}
          alt=""
          className="hidden size-8 object-contain object-center group-data-[collapsible=icon]:block"
        />
    </span>
  );
}
