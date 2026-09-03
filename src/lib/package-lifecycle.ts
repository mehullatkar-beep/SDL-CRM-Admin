export type PackageListStatus = "active" | "expired" | "archived";

function asDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isPackageExpired(
  validTo: Date | string | null | undefined,
  now = new Date(),
) {
  const date = asDate(validTo);
  if (!date) return false;
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return now.getTime() > end.getTime();
}

export function packageListStatus(
  pkg: { archived?: boolean; validTo?: Date | string | null },
  now = new Date(),
): PackageListStatus {
  if (pkg.archived) return "archived";
  if (isPackageExpired(pkg.validTo, now)) return "expired";
  return "active";
}

export function formatPackageDate(value: Date | string | null | undefined) {
  const date = asDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function packageValidityLabel(
  validFrom: Date | string | null | undefined,
  validTo: Date | string | null | undefined,
) {
  const fromDate = asDate(validFrom);
  const toDate = asDate(validTo);
  if (!fromDate && !toDate) return "Open-ended";
  if (fromDate && toDate && fromDate.getFullYear() === toDate.getFullYear()) {
    const from = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
    }).format(fromDate);
    return `${from} – ${formatPackageDate(toDate)}`;
  }
  return `${formatPackageDate(fromDate)} – ${formatPackageDate(toDate)}`;
}

export function copyPackageName(name: string) {
  const trimmed = name.trim() || "Package";
  const base = trimmed.replace(/\s*\(copy(?: \d+)?\)$/i, "").trim() || "Package";
  return `${base} (copy)`;
}
