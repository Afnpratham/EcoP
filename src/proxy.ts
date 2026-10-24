import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
const protectedPaths = [
  "/dashboard",
  "/profile",
  "/rewards",
  "/leaderboard",
  "/impact",
];
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  // Device endpoints use HMAC and must never depend on user-auth availability.
  if (request.nextUrl.pathname.startsWith("/api/")) return response;
  if (process.env.ECOP_DEMO_MODE === "true") return response;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let signedIn = false;
  if (url && key) {
    const db = createServerClient<Database>(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values) {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });
    try {
      const {
        data: { user },
      } = await db.auth.getUser();
      signedIn = Boolean(user);
    } catch {
      signedIn = false;
    }
  }
  if (
    !signedIn &&
    protectedPaths.some(
      (p) =>
        request.nextUrl.pathname === p ||
        request.nextUrl.pathname.startsWith(p + "/"),
    )
  ) {
    const target = new URL("/login", request.url);
    target.searchParams.set("redirect", request.nextUrl.pathname);
    const redirect = NextResponse.redirect(target);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }
  return response;
}
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
