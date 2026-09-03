import type { NextConfig } from "next";

const patientPortalOrigin =
  process.env.NEXT_PUBLIC_PATIENT_PORTAL_ORIGIN ?? "http://localhost:3000";
const scriptSource =
  process.env.NODE_ENV === "development"
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'";

const securityHeaders = [
  { key: "Content-Security-Policy", value: `default-src 'self'; img-src 'self' data: blob: https://*.public.blob.vercel-storage.com; style-src 'self' 'unsafe-inline'; ${scriptSource}; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'` },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ...(process.env.VERCEL
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["@electric-sql/pglite"],
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  images: {
    localPatterns: [
      { pathname: "/uploads/packages/**" },
      { pathname: "/uploads/banners/**" },
      { pathname: "/brand/**" },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/packages/**",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/banners/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/uploads/packages/:path*",
        headers: [{ key: "Access-Control-Allow-Origin", value: patientPortalOrigin }],
      },
      {
        source: "/uploads/banners/:path*",
        headers: [{ key: "Access-Control-Allow-Origin", value: patientPortalOrigin }],
      },
    ];
  },
};

export default nextConfig;
