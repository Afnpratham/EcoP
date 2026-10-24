import { describe, it, expect } from "vitest";
import { decideProof, personalizedGuidance } from "./proof-engine";
describe("independent disposal corroboration", () => {
  it("awards only with temporal vision and beam evidence", () => {
    expect(
      decideProof({ vision: true, tracked: true, beam: true, load: true })
        .points,
    ).toBe(10);
    expect(
      decideProof({ vision: true, tracked: true, beam: true, load: null })
        .points,
    ).toBe(10);
  });
  it("does not award for holding a bottle in front of camera", () => {
    expect(
      decideProof({ vision: true, tracked: false, beam: false, load: false })
        .points,
    ).toBe(0);
  });
  it("sends conflicting load signal to review", () => {
    expect(
      decideProof({ vision: true, tracked: true, beam: true, load: false })
        .outcome,
    ).toBe("inconclusive");
  });
  it("fails closed when break-beam is absent", () => {
    expect(
      decideProof({ vision: true, tracked: true, beam: false, load: null })
        .points,
    ).toBe(0);
  });
  it("does not generate automatic penalties", () => {
    for (const a of [false, true])
      for (const b of [false, true])
        for (const c of [false, true])
          expect([0, 10]).toContain(
            decideProof({ vision: a, tracked: b, beam: c, load: null }).points,
          );
  });
  it("changes tips after recurring warnings", () => {
    expect(
      personalizedGuidance(["suspected_incorrect", "suspected_incorrect"]),
    ).toContain("marked deposit zone");
    expect(personalizedGuidance(["inconclusive"])).toContain(
      "needs verification",
    );
  });
});
