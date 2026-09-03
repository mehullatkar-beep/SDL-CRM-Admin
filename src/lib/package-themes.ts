export const PACKAGE_THEME_IDS = ["sage", "ocean", "coral", "violet", "slate", "custom"] as const;

export type PackageThemeId = (typeof PACKAGE_THEME_IDS)[number];

export type ResolvedPackageTheme = {
  label: string;
  accent: string;
  accentForeground: string;
  surface: string;
  muted: string;
};

export const PACKAGE_THEMES: Record<Exclude<PackageThemeId, "custom">, ResolvedPackageTheme> = {
  sage: {
    label: "Sage",
    accent: "oklch(0.43 0.09 205)",
    accentForeground: "oklch(0.985 0.008 205)",
    surface: "oklch(0.98 0.01 205)",
    muted: "oklch(0.45 0.04 205)",
  },
  ocean: {
    label: "Ocean",
    accent: "oklch(0.42 0.12 250)",
    accentForeground: "oklch(0.98 0.01 250)",
    surface: "oklch(0.975 0.015 250)",
    muted: "oklch(0.42 0.05 250)",
  },
  coral: {
    label: "Coral",
    accent: "oklch(0.55 0.16 35)",
    accentForeground: "oklch(0.99 0.01 35)",
    surface: "oklch(0.98 0.015 40)",
    muted: "oklch(0.45 0.06 35)",
  },
  violet: {
    label: "Violet",
    accent: "oklch(0.45 0.14 310)",
    accentForeground: "oklch(0.98 0.01 310)",
    surface: "oklch(0.975 0.015 310)",
    muted: "oklch(0.42 0.06 310)",
  },
  slate: {
    label: "Slate",
    accent: "oklch(0.32 0.02 250)",
    accentForeground: "oklch(0.98 0.005 250)",
    surface: "oklch(0.97 0.005 250)",
    muted: "oklch(0.42 0.02 250)",
  },
};

export const HEX_COLOR_PATTERN = /^#([0-9a-fA-F]{6})$/;

export function isPackageThemeId(value: string): value is PackageThemeId {
  return PACKAGE_THEME_IDS.includes(value as PackageThemeId);
}

export function normalizeHexColor(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return withHash.toUpperCase();
}

export function isHexColor(value: string): boolean {
  return HEX_COLOR_PATTERN.test(normalizeHexColor(value));
}

function hexToRgb(hex: string) {
  const value = parseInt(hex.slice(1), 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

function mixTowardWhite(channel: number, amount: number) {
  return Math.round(channel + (255 - channel) * amount);
}

function themeFromHex(hex: string): ResolvedPackageTheme {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return {
    label: "Custom",
    accent: hex,
    accentForeground: luminance > 0.55 ? "#111827" : "#ffffff",
    surface: `rgb(${mixTowardWhite(r, 0.92)} ${mixTowardWhite(g, 0.92)} ${mixTowardWhite(b, 0.92)})`,
    muted: `rgb(${mixTowardWhite(r, 0.35)} ${mixTowardWhite(g, 0.35)} ${mixTowardWhite(b, 0.35)})`,
  };
}

export function resolvePackageTheme(theme: string, customAccentHex = ""): ResolvedPackageTheme {
  if (theme === "custom" && isHexColor(customAccentHex)) {
    return themeFromHex(normalizeHexColor(customAccentHex));
  }
  if (theme !== "custom" && theme in PACKAGE_THEMES) {
    return PACKAGE_THEMES[theme as Exclude<PackageThemeId, "custom">];
  }
  return PACKAGE_THEMES.sage;
}
