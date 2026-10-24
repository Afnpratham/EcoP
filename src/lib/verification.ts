import { z } from "zod";

const token = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[A-Za-z0-9_-]+$/);
export const evidenceSchema = z
  .object({
    confidence: z.number().finite().min(0).max(1),
    trackedFrames: z.number().int().min(0).max(100000),
    durationMs: z.number().finite().min(0).max(300000),
    crossedRim: z.boolean(),
    remainedInside: z.boolean(),
    ambiguousPeople: z.boolean(),
    beam: z.boolean().nullable(),
    load: z.boolean().nullable(),
    reusableBottle: z.boolean().optional(),
    volumeMl: z.number().finite().min(0).max(10000).optional(),
  })
  .strict();
export const verificationSchema = z
  .object({
    version: z.literal(2),
    eventId: z.string().uuid(),
    sessionId: z.string().uuid(),
    deviceId: token,
    binId: token,
    bootId: z.string().uuid(),
    trackId: token,
    kind: z.enum(["disposal", "refill"]),
    timestamp: z.string().datetime({ offset: true }),
    evidence: evidenceSchema,
  })
  .strict();
export type Evidence = z.infer<typeof evidenceSchema>;
export function adjudicate(e: Evidence, kind: "disposal" | "refill") {
  if (e.ambiguousPeople)
    return {
      outcome: "inconclusive",
      reason:
        "Multiple people make attribution uncertain. Human review required.",
    } as const;
  if (kind === "refill") {
    if (
      e.reusableBottle &&
      (e.volumeMl ?? 0) >= 100 &&
      (e.volumeMl ?? 0) <= 2000 &&
      e.confidence >= 0.9
    )
      return {
        outcome: "verified",
        reason: "Station reports a metered refill into a reusable bottle.",
      } as const;
    return {
      outcome: "inconclusive",
      reason: "Reusable bottle or metered refill evidence is insufficient.",
    } as const;
  }
  if (e.beam === false || e.load === false)
    return {
      outcome: "inconclusive",
      reason: "Sensor evidence conflicts with vision. Human review required.",
    } as const;
  if (
    e.confidence >= 0.9 &&
    e.trackedFrames >= 5 &&
    e.durationMs >= 500 &&
    e.crossedRim &&
    e.remainedInside
  )
    return {
      outcome: "verified",
      reason:
        e.beam === true
          ? "Tracked deposit and break-beam agree."
          : "Tracked vision evidence supports disposal; no independent sensor confirmation.",
    } as const;
  return {
    outcome: "inconclusive",
    reason:
      "Insufficient temporal disposal evidence. No penalty applied; review is available.",
  } as const;
}
