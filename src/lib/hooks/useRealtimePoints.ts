"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Subscribes to live changes on the current user's `profiles.eco_points`,
 * `transactions`, and `sessions` rows via Supabase Realtime. When any of them
 * change (e.g. the Awareness Engine confirms a disposal server-side), this
 * invalidates the relevant TanStack Query cache so the dashboard updates live
 * with zero polling.
 *
 * Pass the user's id. Returns nothing.
 */
export function useRealtimePoints(userId: string | undefined | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (
      !userId ||
      userId.startsWith("demo") ||
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
      return;
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel(`user:${userId}:realtime`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
          queryClient.invalidateQueries({ queryKey: ["rewards"] });
          queryClient.invalidateQueries({ queryKey: ["profile"] });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          queryClient.invalidateQueries({ queryKey: ["transactions"] });
          queryClient.invalidateQueries({ queryKey: ["profile"] });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sessions",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_achievements",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          queryClient.invalidateQueries({ queryKey: ["achievements"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
