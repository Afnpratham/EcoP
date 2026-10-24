import { NextResponse } from "next/server";
import { startSessionSchema } from "@/lib/validations";
import { startDemoSession } from "@/lib/demo-store";
import { isDemoMode } from "@/lib/runtime";
import {
  authenticated,
  checkOrigin,
  readJson,
  routeError,
  rpcResult,
} from "@/lib/http";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const { binId } = startSessionSchema
      .strict()
      .parse(await readJson(request));
    if (isDemoMode())
      return NextResponse.json({
        ...(await startDemoSession(binId)),
        mode: "simulation",
      });
    const { db } = await authenticated();
    const { data, error } = await db.rpc("start_ecop_session", {
      p_bin_id: binId,
    });
    return rpcResult(data, error);
  } catch (error) {
    return routeError(error);
  }
}
