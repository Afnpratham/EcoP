import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Server Supabase client bound to the user's session (cookie-based auth).
 * RLS applies — this represents the *current user*. Use in Server Components,
 * Route Handlers, and Server Actions.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Copy .env.example to .env.local and fill it in.",
    );
  }

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: Array<{
          name: string;
          value: string;
          options?: Record<string, unknown>;
        }>,
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as any),
          );
        } catch {
          // The `set` method was called from a Server Component.
          // This is safe to ignore if middleware refreshes the session.
        }
      },
    },
  });
}

/** Convenience: returns the current authenticated user or null. */
export async function getServerUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Convenience: returns the current user's profile row, or null. */
export async function getServerProfile() {
  if (process.env.ECOP_DEMO_MODE === "true") return null;
  const user = await getServerUser();
  if (!user) return null;
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return (result.data ?? null) as import("@/types/database").ProfileRow | null;
}
