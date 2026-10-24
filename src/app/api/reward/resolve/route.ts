import { z } from "zod";
import {
  authenticated,
  checkOrigin,
  readJson,
  routeError,
  rpcResult,
  HttpError,
} from "@/lib/http";
import { isDemoMode } from "@/lib/runtime";
const schema = z
  .object({
    redemptionId: z.string().uuid(),
    action: z.enum(["fulfilled", "cancelled"]),
    note: z.string().trim().min(5).max(500),
  })
  .strict();
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    if (isDemoMode())
      throw new HttpError(
        403,
        "Real fulfillment is unavailable in simulation.",
      );
    const p = schema.parse(await readJson(request));
    const { db } = await authenticated();
    const { data, error } = await db.rpc("resolve_ecop_redemption", {
      p_redemption_id: p.redemptionId,
      p_action: p.action,
      p_note: p.note,
    });
    return rpcResult(data, error);
  } catch (error) {
    return routeError(error);
  }
}
