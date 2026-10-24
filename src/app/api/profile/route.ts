import { isDemoMode } from "@/lib/runtime";
import { HttpError } from "@/lib/http";
import { z } from "zod";
import {
  authenticated,
  checkOrigin,
  readJson,
  routeError,
  rpcResult,
} from "@/lib/http";
const schema = z
  .object({
    full_name: z.string().trim().min(2).max(100),
    leaderboard_opt_in: z.boolean(),
  })
  .strict();
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    if (isDemoMode())
      throw new HttpError(403, "Sample profiles are read-only.");
    const p = schema.parse(await readJson(request));
    const { db, user } = await authenticated();
    const { data, error } = await db
      .from("profiles")
      .update(p)
      .eq("id", user.id)
      .select("full_name,leaderboard_opt_in")
      .single();
    return rpcResult(data, error);
  } catch (error) {
    return routeError(error);
  }
}
