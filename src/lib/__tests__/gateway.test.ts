import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { signBody } from "@/lib/hmac";
const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({ rpc }),
}));
import { receiveDeviceEvent } from "@/lib/device-gateway";
import { adjudicate, verificationSchema } from "@/lib/verification";
import { safeRedirect } from "@/lib/runtime";
const evidence = {
  confidence: 0.95,
  trackedFrames: 8,
  durationMs: 800,
  crossedRim: true,
  remainedInside: true,
  ambiguousPeople: false,
  beam: null,
  load: null,
};
const event = () => ({
  version: 2,
  eventId: randomUUID(),
  sessionId: randomUUID(),
  deviceId: "test",
  binId: "BIN-014",
  bootId: randomUUID(),
  trackId: "1",
  kind: "disposal",
  timestamp: new Date().toISOString(),
  evidence,
});
const secret = "test-secret-with-at-least-32-characters";
function request(value: unknown, signature?: string) {
  const body = JSON.stringify(value);
  return new Request("http://localhost/api/disposal/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Signature": signature ?? signBody(body, secret),
    },
    body,
  });
}
beforeEach(() => {
  vi.stubEnv("ECOP_DEMO_MODE", "false");
  vi.stubEnv("ECOP_DEVICE_KEYS", JSON.stringify({ test: secret }));
  rpc.mockReset();
  rpc.mockResolvedValue({
    data: { outcome: "verified", pointsAwarded: 10 },
    error: null,
  });
});
afterEach(() => vi.unstubAllEnvs());
describe("device API security", () => {
  it("rejects unsigned and tampered events before touching DB", async () => {
    expect(
      (await receiveDeviceEvent(request(event(), "bad"), "disposal")).status,
    ).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("accepts valid signed evidence and binds the RPC payload", async () => {
    const e = event();
    expect((await receiveDeviceEvent(request(e), "disposal")).status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("record_ecop_event", {
      p_event: expect.objectContaining({
        sessionId: e.sessionId,
        outcome: "verified",
        requestHash: expect.any(String),
      }),
    });
  });
  it("rejects replay outside freshness window", async () => {
    expect(
      (
        await receiveDeviceEvent(
          request({
            ...event(),
            timestamp: new Date(Date.now() - 121000).toISOString(),
          }),
          "disposal",
        )
      ).status,
    ).toBe(409);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("rejects numeric seconds and legacy bin-only contracts", async () => {
    expect(
      (
        await receiveDeviceEvent(
          request({
            binId: "BIN-014",
            result: "success",
            timestamp: Date.now() / 1000,
          }),
          "disposal",
        )
      ).status,
    ).toBe(400);
  });
  it("rejects unknown fields, wrong kind and oversized body", async () => {
    expect(
      (
        await receiveDeviceEvent(
          request({ ...event(), userId: randomUUID() }),
          "disposal",
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await receiveDeviceEvent(
          request({ ...event(), kind: "refill" }),
          "disposal",
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await receiveDeviceEvent(
          request({ ...event(), padding: "x".repeat(20000) }),
          "disposal",
        )
      ).status,
    ).toBe(413);
  });
  it("rejects real device ingestion in simulation", async () => {
    vi.stubEnv("ECOP_DEMO_MODE", "true");
    expect(
      (await receiveDeviceEvent(request(event()), "disposal")).status,
    ).toBe(403);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("returns DB conflicts without fabricating a reward", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: "CONFLICT: Session already resolved" },
    });
    const response = await receiveDeviceEvent(request(event()), "disposal");
    expect(response.status).toBe(409);
    expect((await response.json()).pointsAwarded).toBeUndefined();
  });
  it("keeps ambiguity and contradictory sensors in review", () => {
    expect(
      adjudicate({ ...evidence, ambiguousPeople: true }, "disposal").outcome,
    ).toBe("inconclusive");
    expect(adjudicate({ ...evidence, load: false }, "disposal").outcome).toBe(
      "inconclusive",
    );
    expect(
      adjudicate({ ...evidence, crossedRim: false }, "disposal").outcome,
    ).toBe("inconclusive");
  });
  it("validates refill volume and reusable bottle", () => {
    expect(
      adjudicate({ ...evidence, reusableBottle: true, volumeMl: 500 }, "refill")
        .outcome,
    ).toBe("verified");
    expect(
      adjudicate(
        { ...evidence, reusableBottle: false, volumeMl: 500 },
        "refill",
      ).outcome,
    ).toBe("inconclusive");
  });
  it("rejects non-finite confidence", () => {
    expect(
      verificationSchema.safeParse({
        ...event(),
        evidence: { ...evidence, confidence: NaN },
      }).success,
    ).toBe(false);
  });
  it("blocks unsafe login redirects", () => {
    for (const value of [
      "https://evil.invalid",
      "//evil.invalid",
      "/\\evil.invalid",
      "javascript:alert(1)",
      "/\n/evil.invalid",
    ])
      expect(safeRedirect(value)).toBe("/dashboard");
    expect(safeRedirect("/impact")).toBe("/impact");
  });
});
