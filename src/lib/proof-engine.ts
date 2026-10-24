/** Pure adjudication. Sensor provenance, temporal window and session binding
 * must be authenticated by upstream transport before using this result. */
export type ProofInput = {
  vision: boolean;
  tracked: boolean;
  beam: boolean;
  load: boolean | null;
};
export type ProofDecision =
  | { outcome: "verified"; points: 10; reason: string }
  | {
      outcome: "suspected_incorrect" | "inconclusive";
      points: 0;
      reason: string;
    };
export function decideProof(p: ProofInput): ProofDecision {
  if (p.vision && p.tracked && p.beam && p.load !== false)
    return {
      outcome: "verified",
      points: 10,
      reason: "Temporal object tracking and independent break-beam agree",
    };
  if (!p.vision || (!p.tracked && !p.beam))
    return {
      outcome: "suspected_incorrect",
      points: 0,
      reason: "Bottle deposit could not be supported by sufficient evidence",
    };
  return {
    outcome: "inconclusive",
    points: 0,
    reason: "Evidence conflicts or a signal is missing; sent to human review",
  };
}
export function personalizedGuidance(outcomes: string[]): string {
  const warnings = outcomes.filter((s) => s === "suspected_incorrect").length;
  const uncertain = outcomes.filter((s) => s === "inconclusive").length;
  if (warnings >= 2)
    return "A few attempts may have missed the opening. Aim for the marked deposit zone; no penalty is applied automatically.";
  if (uncertain > 0)
    return "One deposit needs verification. Make sure the bin sensor is active and ask staff if the device is offline.";
  return "Reuse before recycling: carry a refillable bottle and choose packaging-free options.";
}
