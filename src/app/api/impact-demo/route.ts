import { checkOrigin, routeError } from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { decideProof, personalizedGuidance } from "@/lib/proof-engine";

/**
 * An explicitly isolated DEMO LAB. This never edits real Eco Points or
 * Supabase state. Production hardware input must use authenticated edge
 * device credentials and a transactional database ledger.
 */
type Outcome = "verified" | "suspected_incorrect" | "inconclusive";
type Event = {
  id: string;
  time: string;
  bin: string;
  outcome: Outcome;
  vision: boolean;
  tracked: boolean;
  beam: boolean;
  load: boolean | null;
  points: number;
  reason: string;
  appealed: boolean;
  reviewed: boolean;
};
type Batch = {
  id: string;
  time: string;
  massKg: number;
  origin: string;
  state: "collected" | "accepted";
  contamination: string;
};
type Refill = {
  id: string;
  time: string;
  station: string;
  type: "reuse";
  points: number;
};
type Data = { events: Event[]; batches: Batch[]; refills: Refill[] };
const file = path.join(
  process.env.ECOP_DEMO_DATA_DIR || path.join(process.cwd(), "data"),
  "impact-demo.json",
);
const command = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("verify"),
    vision: z.boolean(),
    tracked: z.boolean(),
    beam: z.boolean(),
    load: z.boolean().nullable(),
    bin: z.string().min(2).max(50),
    eventId: z.string().uuid(),
  }),
  z.object({
    action: z.literal("collect"),
    massKg: z.number().positive().max(1000),
    origin: z.string().min(2).max(50),
    contamination: z.string().max(200),
  }),
  z.object({ action: z.literal("accept"), batchId: z.string().uuid() }),
  z.object({ action: z.literal("refill"), station: z.string().min(2).max(50) }),
  z.object({ action: z.literal("appeal"), eventId: z.string().uuid() }),
  z.object({
    action: z.literal("review"),
    eventId: z.string().uuid(),
    approve: z.boolean(),
  }),
  z.object({ action: z.literal("reset") }),
]);
let pending = Promise.resolve();
function queue<T>(work: () => Promise<T>): Promise<T> {
  const next = pending.then(work, work);
  pending = next.then(
    () => {},
    () => {},
  );
  return next;
}
function enabled() {
  return process.env.ECOP_DEMO_MODE === "true";
}
async function load(): Promise<Data> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as Data;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    return { events: [], batches: [], refills: [] };
  }
}
async function save(data: Data) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file + ".tmp", JSON.stringify(data, null, 2));
  await fs.rename(file + ".tmp", file);
}
function summary(data: Data) {
  const verified = data.events.filter((e) => e.outcome === "verified");
  const accepted = data.batches.filter((b) => b.state === "accepted");
  return {
    ...data,
    statistics: {
      verified: verified.length,
      review: data.events.filter(
        (e) => e.outcome === "inconclusive" && !e.reviewed,
      ).length,
      warnings: data.events.filter((e) => e.outcome === "suspected_incorrect")
        .length,
      earned:
        verified.reduce((s, e) => s + e.points, 0) +
        data.refills.reduce((s, e) => s + e.points, 0),
      collectedKg: data.batches.reduce((s, b) => s + b.massKg, 0),
      acceptedKg: accepted.reduce((s, b) => s + b.massKg, 0),
      preventedEstimate: data.refills.length,
      guidance: personalizedGuidance(data.events.map((e) => e.outcome)),
    },
  };
}
export async function GET() {
  if (!enabled())
    return NextResponse.json(
      { error: "Enable ECOP_DEMO_MODE=true for the isolated lab" },
      { status: 403 },
    );
  return queue(async () => NextResponse.json(summary(await load())));
}
export async function POST(request: NextRequest) {
  if (!enabled())
    return NextResponse.json({ error: "Demo mode disabled" }, { status: 403 });
  try {
    checkOrigin(request);
  } catch (error) {
    return routeError(error);
  }
  const parsed = command.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  return queue(async () => {
    const data = await load();
    const p = parsed.data;
    if (p.action === "reset") {
      const empty: Data = { events: [], batches: [], refills: [] };
      await save(empty);
      return NextResponse.json(summary(empty));
    }
    if (p.action === "verify") {
      if (data.events.some((e) => e.id === p.eventId))
        return NextResponse.json(
          { error: "Replay rejected: event ID already processed" },
          { status: 409 },
        );
      const { outcome, reason } = decideProof(p);
      data.events.unshift({
        id: p.eventId,
        time: new Date().toISOString(),
        bin: p.bin,
        outcome,
        vision: p.vision,
        tracked: p.tracked,
        beam: p.beam,
        load: p.load,
        points: outcome === "verified" ? 10 : 0,
        reason,
        appealed: false,
        reviewed: false,
      });
    }
    if (p.action === "collect")
      data.batches.unshift({
        id: crypto.randomUUID(),
        time: new Date().toISOString(),
        massKg: p.massKg,
        origin: p.origin,
        state: "collected",
        contamination: p.contamination,
      });
    if (p.action === "accept") {
      const batch = data.batches.find((b) => b.id === p.batchId);
      if (!batch)
        return NextResponse.json({ error: "Unknown batch" }, { status: 404 });
      if (batch.state === "accepted")
        return NextResponse.json(
          { error: "Already accepted" },
          { status: 409 },
        );
      batch.state = "accepted";
    }
    if (p.action === "refill")
      data.refills.unshift({
        id: crypto.randomUUID(),
        time: new Date().toISOString(),
        station: p.station,
        type: "reuse",
        points: 2,
      });
    if (p.action === "appeal" || p.action === "review") {
      const e = data.events.find((e) => e.id === p.eventId);
      if (!e)
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      if (p.action === "appeal") e.appealed = true;
      else {
        if (e.outcome !== "inconclusive" || e.reviewed)
          return NextResponse.json(
            { error: "Not awaiting review" },
            { status: 409 },
          );
        e.reviewed = true;
        e.outcome = p.approve ? "verified" : "suspected_incorrect";
        e.points = p.approve ? 10 : 0;
        e.reason = p.approve
          ? "Approved in demonstration review"
          : "Rejected in demonstration review";
      }
    }
    await save(data);
    return NextResponse.json(summary(data));
  });
}
