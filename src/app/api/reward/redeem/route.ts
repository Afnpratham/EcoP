import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redeemRewardSchema } from "@/lib/validations";
import { redeemDemoReward } from "@/lib/demo-store";
import {
  apiError,
  apiSuccess,
  zodErrorResponse,
  internalErrorResponse,
} from "@/lib/api-error";
import type { RewardRow, ProfileRow } from "@/types/database";

/**
 * POST /api/reward/redeem
 * Auth: user session.
 * Body: { rewardId }
 */
export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("VALIDATION_ERROR", "Request body must be valid JSON.");
    }

    const parsed = redeemRewardSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);
    const { rewardId } = parsed.data;

    let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
    try {
      supabase = await createSupabaseServerClient();
    } catch {
      return redeemFromDemoStore(rewardId);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return redeemFromDemoStore(rewardId);
    }

    // Check reward exists and is active
    const rewardResult = await supabase
      .from("rewards")
      .select("*")
      .eq("id", rewardId)
      .maybeSingle();
    const reward = rewardResult.data as RewardRow | null;

    if (!reward) {
      return apiError("REWARD_NOT_FOUND", "Reward not found.");
    }

    if (!reward.active) {
      return apiError("REWARD_NOT_FOUND", "This reward is no longer available.");
    }

    if (reward.stock <= 0) {
      return apiError("OUT_OF_STOCK", "This reward is currently out of stock.");
    }

    // Check user has enough points
    const profileResult = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    const profile = profileResult.data as ProfileRow | null;

    if (!profile || profile.eco_points < reward.cost_points) {
      return apiError(
        "INSUFFICIENT_POINTS",
        `You need ${reward.cost_points} points but only have ${profile?.eco_points ?? 0}.`,
      );
    }

    // Call the redeem_reward RPC
    const { data, error } = await (supabase as any).rpc("redeem_reward", {
      p_reward_id: rewardId,
    });

    if (error) throw error;

    const rpcData = data as Array<{
      success: boolean;
      redemption_id: string;
      reward_id: string;
      points_spent: number;
      new_total: number;
      status: string;
      reason: string;
    }> | null;

    const result = rpcData?.[0];
    if (!result?.success) {
      switch (result?.status) {
        case "insufficient_points":
          return apiError("INSUFFICIENT_POINTS", result.reason);
        case "out_of_stock":
          return apiError("OUT_OF_STOCK", result.reason);
        default:
          return apiError("INTERNAL_ERROR", result?.reason ?? "Redemption failed.");
      }
    }

    return apiSuccess({
      redemptionId: result.redemption_id,
      rewardId: result.reward_id,
      pointsSpent: result.points_spent,
      newTotal: result.new_total,
    });
  } catch (error) {
    return internalErrorResponse(error);
  }
}

async function redeemFromDemoStore(rewardId: string) {
  const result = await redeemDemoReward(rewardId);

  if (!result.success) {
    switch (result.status) {
      case "not_found":
        return apiError("REWARD_NOT_FOUND", result.message);
      case "out_of_stock":
        return apiError("OUT_OF_STOCK", result.message);
      case "insufficient_points":
        return apiError("INSUFFICIENT_POINTS", result.message);
      default:
        return apiError("INTERNAL_ERROR", result.message ?? "Redemption failed.");
    }
  }

  return apiSuccess({
    redemptionId: result.redemptionId,
    rewardId: result.rewardId,
    pointsSpent: result.pointsSpent,
    newTotal: result.newTotal,
  });
}
