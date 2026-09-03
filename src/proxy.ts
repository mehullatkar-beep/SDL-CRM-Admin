import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

function isPublicAsset(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/uploads/") ||
    pathname === "/favicon.ico" ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff2?)$/i.test(pathname)
  );
}

function missingAuthSecretResponse() {
  return new NextResponse(
    "This admin site is not fully configured yet. Contact SDL support.",
    {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" },
    },
  );
}

const protect = auth((req) => {
  const { pathname } = req.nextUrl;

  if (isPublicAsset(pathname)) {
    return NextResponse.next();
  }

  const isLogin = pathname.startsWith("/login");
  const isPublicPage = isLogin || pathname.startsWith("/p/");

  if (!req.auth && !isPublicPage) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (req.auth && isLogin) {
    return NextResponse.redirect(new URL("/catalog/tests", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export function proxy(...args: Parameters<typeof protect>) {
  if (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET) {
    return missingAuthSecretResponse();
  }
  return protect(...args);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|_next/webpack-hmr|uploads/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
