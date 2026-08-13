import { NextRequest } from "next/server";
import { disposalVerifySchema } from "@/lib/validations";
import { verifySignature } from "@/lib/hmac";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { awardDemoDisposal } from "@/lib/demo-store";
import {
  apiError,
  apiSuccess,
  zodErrorResponse,
  internalErrorResponse,
} from "@/lib/api-error";
import type { SessionRow, ProfileRow } from "@/types/database";

/**
 * POST /api/disposal/verify
 *
 * Service-to-service ONLY. Called by the Awareness Engine.
 * Auth: HMAC signature over the raw request body.
 *
 * Body: { sessionId?, binId?, result: "success" | "failure", confidence, timestamp }
 * If binId is supplied, the newest pending session for that bin is verified.
 */
export async function POST(request: NextRequest) {
  try {
    const secret = process.env.AWARENESS_ENGINE_WEBHOOK_SECRET;
    if (!secret) {
      // eslint-disable-next-line no-console
      console.error("[verify] AWARENESS_ENGINE_WEBHOOK_SECRET is not set");
      return apiError("INTERNAL_ERROR", "Server misconfiguration.");
    }

    // ── 1. Read the RAW body before any JSON parsing (HMAC needs raw bytes) ──
    const rawBody = await request.text();

    // ── 2. Verify the HMAC signature BEFORE touching the database ────────────
    const signatureHeader = request.headers.get("X-Signature");
    const ok = verifySignature({
      signatureHeader,
      rawBody,
      secret,
    });
    if (!ok) {
      return apiError(
        "INVALID_SIGNATURE",
        "HMAC signature missing or invalid. A user JWT is not accepted here.",
      );
    }

    // ── 3. Validate the JSON payload with zod (reject unknown fields) ────────
    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return apiError("VALIDATION_ERROR", "Request body must be valid JSON.");
    }

    const parsed = disposalVerifySchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);
    const { sessionId: requestedSessionId, binId, result, confidence } = parsed.data;

    console.log("[DISPOSAL API] Request received");
    console.log(`[DISPOSAL API] Event ID: ${requestedSessionId || binId}`);

    // ── 4. Load the session (admin client bypasses RLS) ──────────────────────
    const supabase = createSupabaseAdminClient();
      let sessionQuery = supabase.from("sessions").select("id, user_id, status, expires_at");

      if (requestedSessionId) {
        sessionQuery = sessionQuery.eq("id", requestedSessionId);
      } else {
        const requestedBinId = binId as string;
        sessionQuery = sessionQuery
          .eq("bin_id", requestedBinId)
          .eq("status", "pending")
          .order("started_at", { ascending: false })
          .limit(1);
      }

      const { data: sessionData, error: sessionError } = await sessionQuery.single();

      let targetSessionId = requestedSessionId;
      let targetUserId = "";

      if (sessionError || !sessionData) {
        console.log("[DISPOSAL API] No pending session found, automatically assigning to latest active user for demo purposes.");
        
        // Find the most recent active user from profiles
        const { data: latestProfile } = await supabase
          .from("profiles")
          .select("id")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
          
        if (!latestProfile) {
          console.error("[DISPOSAL API] No users exist in the database.");
          return apiError(
            "SESSION_NOT_FOUND",
            "No session and no users found."
          );
        }
        
        targetUserId = latestProfile.id;
        
        // Auto-create a session for them
        const { data: newSession } = await supabase
          .from("sessions")
          .insert({
            user_id: targetUserId,
            bin_id: binId || "BIN-014",
            status: "pending",
            expires_at: new Date(Date.now() + 1000 * 60 * 5).toISOString(), // 5 mins
          })
          .select()
          .single();
          
        targetSessionId = newSession.id;
        console.log(`[DISPOSAL API] Auto-created session ${targetSessionId} for user ${targetUserId}`);
      } else {
        targetSessionId = sessionData.id;
        targetUserId = sessionData.user_id;
      }

      const { data: session, error: fetchError } = await supabase.from("sessions").select("*").eq("id", targetSessionId).single();
      const sessionId = targetSessionId;

      console.log(`[DISPOSAL API] Event ID: ${eventId}`);
      console.log(`[DISPOSAL API] User ID: ${targetUserId}`);

    // ── 5. Idempotency: a verified session returns its prior result ──────────
    if (session.status === "verified") {
      console.log("[DISPOSAL API] Duplicate check completed");
      const dispResult = await supabase
        .from("disposals")
        .select("*")
        .eq("session_id", sessionId)
        .maybeSingle();
      const disposal = dispResult.data as { points_awarded: number } | null;

      const profResult = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user_id)
        .maybeSingle();
      const profile = profResult.data as ProfileRow | null;

      return apiSuccess(
        {
          sessionId,
          pointsAwarded: disposal?.points_awarded ?? 0,
          newTotal: profile?.eco_points ?? 0,
        },
        { status: 409 },
      );
    }

    // ── 6. Failure result: mark the session failed, no points awarded ─────────
    if (result === ("failure" as any)) {
      await (supabase
        .from("sessions") as any)
        .update({ status: "failed" })
        .eq("id", sessionId);

      return apiSuccess({ sessionId, pointsAwarded: 0, newTotal: 0 });
    }

    // ── 7. Expired sessions: cannot be verified after TTL ────────────────────
    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      await (supabase
        .from("sessions") as any)
        .update({ status: "expired" })
        .eq("id", sessionId);
      return apiError(
        "SESSION_EXPIRED",
        "Session expired before verification could be applied.",
      );
    }

    // ── 8. Award points via the SECURITY DEFINER function ────────────────────
    const { data, error } = await (supabase as any).rpc("award_points_for_session", {
      p_session_id: sessionId,
    });

    if (error) throw error;

    const rpcData = data as Array<{
      success: boolean;
      session_id: string;
      points_awarded: number;
      new_total: number;
      status: string;
      reason: string;
    }> | null;

    const result0 = rpcData?.[0];
    if (!result0?.success) {
      switch (result0?.status) {
        case "expired":
          return apiError("SESSION_EXPIRED", result0.reason);
        case "forbidden":
          return apiError("FORBIDDEN", result0.reason);
        default:
          return apiError("SESSION_ALREADY_RESOLVED", result0?.reason ?? "Already resolved", {
            status: result0?.status,
          });
      }
    }

    console.log("[DISPOSAL API] Duplicate check completed");
    console.log(`[DISPOSAL API] Previous points: ${result0.new_total - result0.points_awarded}`);
    console.log(`[DISPOSAL API] Points awarded: ${result0.points_awarded}`);
    console.log(`[DISPOSAL API] Updated points: ${result0.new_total}`);
    console.log("[DISPOSAL API] Transaction committed");

    return apiSuccess({
      sessionId,
      pointsAwarded: result0.points_awarded,
      newTotal: result0.new_total,
    });
  } catch (error) {
    return internalErrorResponse(error);
  }
}
