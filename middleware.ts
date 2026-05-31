import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes only for unauthenticated users — redirect to /home if already logged in
const AUTH_ONLY_ROUTES = new Set(["/", "/login"]);

// Route prefixes that require a session — redirect to /login if not authed
const PROTECTED_PREFIXES = [
  "/home",
  "/friends",
  "/profile",
  "/matches",
  "/match",
];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

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
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Always refresh the session so cookies stay current
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Logged-in users have no reason to see the landing or login page
  if (user && AUTH_ONLY_ROUTES.has(pathname)) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // Unauthenticated users can't access the app shell
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!user && isProtected) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
