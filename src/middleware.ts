import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const PUBLIC_SEGMENTS = ["login", "privacy"];

export async function middleware(request: NextRequest) {
  const response = intlMiddleware(request);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const segments = request.nextUrl.pathname.split("/").filter(Boolean);
  const withoutLocale = routing.locales.includes(
    segments[0] as (typeof routing.locales)[number],
  )
    ? segments.slice(1)
    : segments;
  const PUBLIC_PATHS = ["auth/set-password", "auth/forgot-password"];
  const isPublic =
    withoutLocale.length === 0 ||
    PUBLIC_SEGMENTS.includes(withoutLocale[0]) ||
    PUBLIC_PATHS.includes(withoutLocale.join("/"));

  if (!user && !isPublic) {
    const locale = routing.locales.includes(
      segments[0] as (typeof routing.locales)[number],
    )
      ? segments[0]
      : routing.defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
