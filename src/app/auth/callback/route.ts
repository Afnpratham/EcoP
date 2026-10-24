import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeRedirect } from "@/lib/runtime";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    try {
      const db = await createSupabaseServerClient();
      const { error } = await db.auth.exchangeCodeForSession(code);
      if (!error)
        return NextResponse.redirect(
          new URL(
            safeRedirect(url.searchParams.get("next")),
            process.env.NEXT_PUBLIC_SITE_URL || url.origin,
          ),
        );
    } catch {}
  }
  return NextResponse.redirect(
    new URL(
      "/login?error=confirmation",
      process.env.NEXT_PUBLIC_SITE_URL || url.origin,
    ),
  );
}
