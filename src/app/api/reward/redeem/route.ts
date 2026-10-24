import { NextResponse } from "next/server";
import { z } from "zod";
import { redeemDemoReward } from "@/lib/demo-store";
import { isDemoMode } from "@/lib/runtime";
import {
  authenticated,
  checkOrigin,
  readJson,
  routeError,
  rpcResult,
  HttpError,
} from "@/lib/http";
const schema = z
  .object({ rewardId: z.string().uuid(), requestId: z.string().uuid() })
  .strict();
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const { rewardId, requestId } = schema.parse(await readJson(request));
    if (isDemoMode()) {
      const result = await redeemDemoReward(rewardId, requestId);
      if (!result.success)
        throw new HttpError(409, result.message ?? "Redemption failed.");
      return NextResponse.json({ ...result, mode: "simulation" });
    }
    const { db } = await authenticated();
    const { data, error } = await db.rpc("redeem_ecop_reward", {
      p_reward_id: rewardId,
      p_request_id: requestId,
    });
    return rpcResult(data, error);
  } catch (error) {
    return routeError(error);
  }
}
