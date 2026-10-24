import { z } from "zod";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifySignature } from "@/lib/hmac";
import { readBody, HttpError, routeError } from "@/lib/http";
import { isDemoMode } from "@/lib/runtime";
const schema = z
  .object({
    deviceId: z.string().regex(/^[A-Za-z0-9_-]{1,80}$/),
    timestamp: z.string().datetime({ offset: true }),
  })
  .strict();
/** Device can discover only its bin's one pending session. Bind before observing a track. */
export async function POST(request: Request) {
  try {
    if (isDemoMode())
      throw new HttpError(
        403,
        "Device discovery is disabled in simulation mode.",
      );
    const raw = await readBody(request, 2048);
    let input: unknown;
    try {
      input = JSON.parse(raw);
    } catch {
      throw new HttpError(400, "Invalid JSON.");
    }
    const p = schema.parse(input);
    const keys: Record<string, string> = JSON.parse(
      process.env.ECOP_DEVICE_KEYS || "{}",
    );
    const key = Object.prototype.hasOwnProperty.call(keys, p.deviceId)
      ? keys[p.deviceId]
      : null;
    if (
      typeof key !== "string" ||
      key.length < 32 ||
      !verifySignature({
        rawBody: raw,
        secret: key,
        signatureHeader: request.headers.get("x-signature"),
      })
    )
      throw new HttpError(401, "Unknown device or invalid signature.");
    if (Math.abs(Date.now() - Date.parse(p.timestamp)) > 30000)
      throw new HttpError(401, "Expired device request.");
    const db = createSupabaseAdminClient();
    const device = await db
      .from("devices")
      .select("bin_id,active")
      .eq("id", p.deviceId)
      .maybeSingle();
    if (device.error) throw device.error;
    if (!device.data?.active)
      throw new HttpError(403, "Device is unavailable.");
    const { data, error } = await db
      .from("sessions")
      .select("id,bin_id,expires_at,kind")
      .eq("bin_id", device.data.bin_id)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json(
      {
        session: data
          ? {
              sessionId: data.id,
              binId: data.bin_id,
              expiresAt: data.expires_at,
              kind: data.kind,
            }
          : null,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return routeError(error);
  }
}
