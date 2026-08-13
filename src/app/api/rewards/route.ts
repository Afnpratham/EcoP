import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDemoStore } from "@/lib/demo-store";
import { internalErrorResponse } from "@/lib/api-error";
import type { RewardRow } from "@/types/database";

/**
 * GET /api/rewards
 * Returns all active rewards. Auth optional.
 */
export async function GET() {
  try {
    let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
    try {
      supabase = await createSupabaseServerClient();
    } catch {
      const store = await getDemoStore();
      return NextResponse.json({
        rewards: store.rewards.filter((reward) => reward.active),
        availablePoints: store.user.eco_points,
      });
    }

    const result = await supabase
      .from("rewards")
      .select("*")
      .eq("active", true)
      .order("cost_points", { ascending: true });

    if (result.error) throw result.error;

    const rewards = (result.data ?? []) as RewardRow[];

    return NextResponse.json({ rewards });
  } catch (error) {
    try {
      const store = await getDemoStore();
      return NextResponse.json({
        rewards: store.rewards.filter((reward) => reward.active),
        availablePoints: store.user.eco_points,
      });
    } catch {
      return internalErrorResponse(error);
    }
  }
}
