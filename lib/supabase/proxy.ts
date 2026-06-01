import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/auth/callback",
  "/manifest.webmanifest",
  "/terms",
  "/privacy",
  "/about",
  "/contribute",
];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
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
          response = NextResponse.next({ request });
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

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const isDevPreview =
    process.env.NODE_ENV !== "production" &&
    (pathname === "/onboarding/profile" ||
      pathname === "/onboarding/preferences-intro" ||
      pathname === "/onboarding/preferences") &&
    request.nextUrl.searchParams.get("preview") === "1";

  if (!user && !isPublic && !isDevPreview) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Preserve the original destination so post-login routes back there.
    const dest = pathname + (request.nextUrl.search ?? "");
    if (dest && dest !== "/") {
      url.searchParams.set("next", dest);
    }
    return NextResponse.redirect(url);
  }

  return response;
}
