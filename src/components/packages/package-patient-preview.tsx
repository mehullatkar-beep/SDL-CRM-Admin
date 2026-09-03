import Image from "next/image";
import { FlaskConical, Home, MapPin, Package, Timer, UserRound } from "lucide-react";
import { formatMoney } from "@/lib/catalog";
import type { CatalogTest } from "@/lib/catalog-queries";
import type { PackageFormValues } from "@/lib/package-form";
import { FULFILLMENT_MODES } from "@/lib/package-fulfillment";
import {
  isHexColor,
  normalizeHexColor,
  PACKAGE_THEMES,
  resolvePackageTheme,
  type PackageThemeId,
} from "@/lib/package-themes";
import { summarizeSelectedTests } from "@/lib/package-summary";
import { cn } from "@/lib/utils";

const FULFILLMENT_ICONS = {
  self_registration: UserRound,
  appointment: MapPin,
  home_collection: Home,
  appointment_home_collection: Home,
  kit: Package,
} as const;

export function PackagePatientPreview({
  values,
  selectedTests,
  offerPrice,
  listPrice,
  savings,
}: {
  values: PackageFormValues;
  selectedTests: CatalogTest[];
  offerPrice: number;
  listPrice: number;
  savings: number;
}) {
  const theme = resolvePackageTheme(values.theme, values.customAccentHex);
  const summary = summarizeSelectedTests(selectedTests);
  const fastingLabel =
    values.fastingHours == null
      ? null
      : values.fastingHours === 0
        ? "No fasting"
        : `${values.fastingHours}h fasting`;
  const fulfillment = FULFILLMENT_MODES.find((mode) => mode.id === values.fulfillmentMode);
  const FulfillmentIcon = FULFILLMENT_ICONS[values.fulfillmentMode];

  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-[1.75rem] border bg-white shadow-sm">
      <div className="relative h-36 bg-muted">
        {values.bannerImageUrl ? (
          <Image
            src={values.bannerImageUrl}
            alt=""
            fill
            unoptimized
            className="object-cover"
            sizes="384px"
          />
        ) : (
          <div
            className="flex h-full items-center justify-center text-sm font-medium"
            style={{ background: theme.surface, color: theme.muted }}
          >
            Package banner
          </div>
        )}
      </div>
      <div className="space-y-4 p-4">
        {values.category ? (
          <p className="text-xs font-medium tracking-wide uppercase" style={{ color: theme.accent }}>
            {values.category}
          </p>
        ) : null}
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-neutral-900">
            {values.name || "Package name"}
          </h3>
          {values.description ? (
            <p className="mt-1 line-clamp-3 text-sm text-neutral-500">{values.description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-2xl font-semibold" style={{ color: theme.accent }}>
            {formatMoney(offerPrice)}
          </span>
          {savings > 0 ? (
            <span className="text-sm text-neutral-400 line-through">{formatMoney(listPrice)}</span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-1 text-neutral-700">
            <FlaskConical className="size-3" />
            {summary.testCount} {summary.testCount === 1 ? "test" : "tests"}
          </span>
          {fulfillment ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-1 text-neutral-700">
              <FulfillmentIcon className="size-3" />
              {fulfillment.label}
            </span>
          ) : null}
          {fastingLabel ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-1 text-neutral-700">
              <Timer className="size-3" />
              {fastingLabel}
            </span>
          ) : null}
          {summary.reportHours != null ? (
            <span className="rounded-full bg-neutral-100 px-2 py-1 text-neutral-700">
              Reports in {summary.reportHours}h
            </span>
          ) : null}
        </div>
        {selectedTests.length > 0 ? (
          <div>
            <p className="mb-1.5 text-xs font-medium text-neutral-500">Includes</p>
            <p className="text-sm text-neutral-700">
              {selectedTests.map((test) => test.name).join(", ")}
            </p>
          </div>
        ) : (
          <p className="text-sm text-neutral-400">Add tests to see them here.</p>
        )}
        <div
          className="w-full rounded-lg py-2.5 text-center text-sm font-medium"
          style={{ background: theme.accent, color: theme.accentForeground }}
        >
          Add to cart
        </div>
      </div>
    </div>
  );
}

export function PackageThemePicker({
  value,
  customHex,
  canEdit,
  onChange,
}: {
  value: PackageThemeId;
  customHex: string;
  canEdit: boolean;
  onChange: (theme: PackageThemeId, customHex?: string) => void;
}) {
  const hex = isHexColor(customHex) ? normalizeHexColor(customHex) : "#0F766E";
  const customSelected = value === "custom";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(PACKAGE_THEMES) as Array<Exclude<PackageThemeId, "custom">>).map((id) => {
          const theme = PACKAGE_THEMES[id];
          const selected = value === id;
          return (
            <button
              key={id}
              type="button"
              disabled={!canEdit}
              onClick={() => onChange(id)}
              className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm disabled:opacity-60"
              style={{
                borderColor: selected ? theme.accent : undefined,
                boxShadow: selected ? `0 0 0 1px ${theme.accent}` : undefined,
              }}
            >
              <span className="size-4 rounded-full" style={{ background: theme.accent }} aria-hidden />
              {theme.label}
            </button>
          );
        })}
        <button
          type="button"
          disabled={!canEdit}
          onClick={() => onChange("custom", hex)}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm disabled:opacity-60",
          )}
          style={{
            borderColor: customSelected ? hex : undefined,
            boxShadow: customSelected ? `0 0 0 1px ${hex}` : undefined,
          }}
        >
          <span className="size-4 rounded-full" style={{ background: hex }} aria-hidden />
          Custom
        </button>
      </div>
      {customSelected ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="color"
            aria-label="Custom accent color"
            value={hex}
            disabled={!canEdit}
            onChange={(event) => onChange("custom", event.target.value.toUpperCase())}
            className="size-9 cursor-pointer rounded-md border bg-background p-1 disabled:cursor-not-allowed"
          />
          <input
            value={customHex}
            disabled={!canEdit}
            spellCheck={false}
            placeholder="#0F766E"
            onChange={(event) => onChange("custom", event.target.value)}
            className="border-input h-9 w-32 rounded-md border bg-transparent px-3 font-mono text-sm uppercase outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
          />
        </div>
      ) : null}
    </div>
  );
}
