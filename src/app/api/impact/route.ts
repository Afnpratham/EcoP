import { NextResponse } from "next/server";
import { z } from "zod";
import {
  authenticated,
  checkOrigin,
  readJson,
  routeError,
  rpcResult,
  HttpError,
} from "@/lib/http";
import { personalizedGuidance } from "@/lib/proof-engine";
import { isDemoMode } from "@/lib/runtime";
const command = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("appeal"),
      eventId: z.string().uuid(),
      reason: z.string().trim().min(10).max(1000),
    })
    .strict(),
  z
    .object({
      action: z.literal("review"),
      eventId: z.string().uuid(),
      approve: z.boolean(),
      reason: z.string().trim().min(10).max(1000),
    })
    .strict(),
  z
    .object({
      action: z.literal("collect"),
      binId: z.string().min(1).max(50),
      mass: z.number().positive().max(1000),
      contamination: z.string().max(1000),
      eventIds: z.array(z.string().uuid()).min(1).max(500),
    })
    .strict(),
  z
    .object({
      action: z.literal("accept"),
      batchId: z.string().uuid(),
      mass: z.number().min(0).max(1000),
      recycler: z.string().trim().min(2).max(200),
      receipt: z.string().trim().min(5).max(500),
    })
    .strict(),
]);
export async function GET() {
  try {
    if (isDemoMode())
      throw new HttpError(409, "Use the simulation lab in demo mode.");
    const { db, user } = await authenticated();
    const results = await Promise.all([
      db
        .from("verification_events")
        .select("*")
        .order("received_at", { ascending: false })
        .limit(100),
      db
        .from("appeals")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      db
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      db
        .from("recycling_batches")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      db.from("batch_items").select("*").limit(1000),
      db.from("profiles").select("role").eq("id", user.id).single(),
    ]);
    for (const r of results) if (r.error) throw r.error;
    const [events, appeals, reviews, batches, items, profile] = results;
    const own = (events.data ?? []).filter((e) => e.user_id === user.id);
    return NextResponse.json(
      {
        mode: "live",
        userId: user.id,
        isAdmin: profile.data?.role === "admin",
        events: events.data,
        appeals: appeals.data,
        reviews: reviews.data,
        batches: batches.data,
        items: items.data,
        guidance: personalizedGuidance(own.map((e) => e.outcome)),
        limit: 100,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return routeError(error);
  }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    if (isDemoMode())
      throw new HttpError(403, "Live operations are disabled in demo mode.");
    const p = command.parse(await readJson(request));
    const { db } = await authenticated();
    const result =
      p.action === "appeal"
        ? await db.rpc("appeal_ecop_event", {
            p_event_id: p.eventId,
            p_reason: p.reason,
          })
        : p.action === "review"
          ? await db.rpc("review_ecop_event", {
              p_event_id: p.eventId,
              p_approve: p.approve,
              p_reason: p.reason,
            })
          : p.action === "collect"
            ? await db.rpc("collect_ecop_batch", {
                p_bin_id: p.binId,
                p_mass: p.mass,
                p_contamination: p.contamination,
                p_event_ids: p.eventIds,
              })
            : await db.rpc("accept_ecop_batch", {
                p_batch_id: p.batchId,
                p_mass: p.mass,
                p_recycler: p.recycler,
                p_receipt: p.receipt,
              });
    return rpcResult(result.data, result.error);
  } catch (error) {
    return routeError(error);
  }
}
