import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { startSessionSchema } from "@/lib/validations";
import { startDemoSession } from "@/lib/demo-store";
import {
  apiError,
  apiSuccess,
  zodErrorResponse,
  internalErrorResponse,
} from "@/lib/api-error";
import {
  SESSION_COOLDOWN_MINUTES,
  SESSION_TTL_SECONDS,
  MAX_SESSIONS_PER_HOUR,
  MAX_SESSIONS_PER_DAY,
} from "@/lib/constants";
import type { BinRow } from "@/types/database";

/**
 * POST /api/session/start
 * Auth: user session (Supabase JWT).
 * Body: { binId }
 * 200 -> { sessionId, binId, status: "pending", expiresAt }
 * 409 -> bin already has a pending session for this user, or cooldown active
 * 404 -> unknown/inactive bin
 */
export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("VALIDATION_ERROR", "Request body must be valid JSON.");
    }

    const parsed = startSessionSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);
    const { binId } = parsed.data;

    let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
    try {
      supabase = await createSupabaseServerClient();
    } catch {
      return apiSuccess(await startDemoSession(binId));
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiSuccess(await startDemoSession(binId));
    }

    // ── Lookup bin ──────────────────────────────────────────────────────────
    const binResult = await supabase
      .from("bins")
      .select("*")
      .eq("id", binId)
      .maybeSingle();
    const bin = binResult.data as BinRow | null;

    if (!bin) return apiError("BIN_NOT_FOUND", `Bin "${binId}" does not exist.`);

    if (bin.status !== "active") {
      return apiError(
        "BIN_INACTIVE",
        `This bin is currently ${bin.status} and can't accept disposals.`,
      );
    }

    // ── Cooldown: same user, same bin, completed within N minutes ───────────
    const cooldownSince = new Date(
      Date.now() - SESSION_COOLDOWN_MINUTES * 60_000,
    ).toISOString();
    const recentResult = await supabase
      .from("sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("bin_id", binId)
      .in("status", ["verified", "pending"])
      .gte("started_at", cooldownSince)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentResult.data) {
      return apiError(
        "COOLDOWN_ACTIVE",
        `You just used this bin. Try a different bin or wait ${SESSION_COOLDOWN_MINUTES} minutes.`,
        { cooldownMinutes: SESSION_COOLDOWN_MINUTES },
      );
    }

    // ── Rate limits: sessions/hour + sessions/day ───────────────────────────
    const oneHourAgo = new Date(Date.now() - 60 * 60_000).toISOString();
    const { count: hourly } = await supabase
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("started_at", oneHourAgo);

    if ((hourly ?? 0) >= MAX_SESSIONS_PER_HOUR) {
      return apiError(
        "RATE_LIMITED",
        `You've reached the limit of ${MAX_SESSIONS_PER_HOUR} sessions per hour.`,
      );
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
    const { count: daily } = await supabase
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("started_at", oneDayAgo);

    if ((daily ?? 0) >= MAX_SESSIONS_PER_DAY) {
      return apiError(
        "RATE_LIMITED",
        `You've reached the limit of ${MAX_SESSIONS_PER_DAY} sessions per day.`,
      );
    }

    // ── Create session (partial unique index rejects a concurrent one) ──────
    const expiresAt = new Date(
      Date.now() + SESSION_TTL_SECONDS * 1000,
    ).toISOString();

    const { data: session, error } = await (supabase
      .from("sessions") as any)
      .insert({
        user_id: user.id,
        bin_id: binId,
        status: "pending",
        expires_at: expiresAt,
      })
      .select("id, expires_at")
      .single();

    if (error) {
      // 23505 = unique_violation -> the bin already has a pending session.
      if (error.code === "23505") {
        return apiError(
          "SESSION_ALREADY_RESOLVED",
          "This bin already has an active disposal session. Please wait and try again.",
        );
      }
      throw error;
    }

    const sessionData = session as { id: string; expires_at: string };

    return apiSuccess({
      sessionId: sessionData.id,
      binId,
      status: "pending" as const,
      expiresAt: sessionData.expires_at,
    });
  } catch (error) {
    return internalErrorResponse(error);
  }
}
