import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Service-role Supabase client. BYPASSES Row Level Security entirely.
 *
 * SECURITY: Import this ONLY inside Route Handlers / Server Actions / server
 * utilities that never ship to the client bundle. Never import from a file
 * that ends up in a Client Component, and never expose the service key to the
 * browser. All trusted operations (point awards, ledger inserts) go through
 * Postgres SECURITY DEFINER functions called with this client.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
        "These are required for trusted server operations.",
    );
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      // We don't use the admin client for user-session management.
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
