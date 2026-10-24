import { createHash } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifySignature } from "@/lib/hmac";
import { readBody, HttpError, routeError, rpcResult } from "@/lib/http";
import { verificationSchema, adjudicate } from "@/lib/verification";
import { isDemoMode } from "@/lib/runtime";

/** Keys are provisioned per device, never shared with the browser. DB controls bin binding. */
export async function receiveDeviceEvent(
  request: Request,
  kind: "disposal" | "refill",
) {
  try {
    if (isDemoMode())
      throw new HttpError(
        403,
        "Real device ingestion is disabled in simulation mode.",
      );
    const raw = await readBody(request);
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      throw new HttpError(400, "Invalid JSON.");
    }
    const event = verificationSchema.parse(body);
    if (event.kind !== kind)
      throw new HttpError(400, "Event kind does not match this endpoint.");
    const keys: Record<string, string> = JSON.parse(
      process.env.ECOP_DEVICE_KEYS || "{}",
    );
    const secret = Object.prototype.hasOwnProperty.call(keys, event.deviceId)
      ? keys[event.deviceId]
      : undefined;
    if (
      typeof secret !== "string" ||
      secret.length < 32 ||
      !verifySignature({
        rawBody: raw,
        secret,
        signatureHeader: request.headers.get("x-signature"),
      })
    )
      throw new HttpError(401, "Unknown device or invalid signature.");
    if (Math.abs(Date.now() - Date.parse(event.timestamp)) > 120000)
      throw new HttpError(
        409,
        "Event delivery window expired. Preserve evidence for operator review.",
      );
    const decision = adjudicate(event.evidence, kind);
    const db = createSupabaseAdminClient();
    const { data, error } = await db.rpc("record_ecop_event", {
      p_event: {
        ...event,
        ...decision,
        requestHash: createHash("sha256").update(raw).digest("hex"),
      },
    });
    return rpcResult(data, error);
  } catch (error) {
    return routeError(error);
  }
}
