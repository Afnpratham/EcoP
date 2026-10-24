import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getLiveDemoEngineConfig,
  requireLiveDemoViewer,
} from "@/lib/live-demo";

afterEach(() => vi.unstubAllEnvs());

describe("live demo gateway configuration", () => {
  it("does not start a proxy without a server-side engine key", () => {
    vi.stubEnv("ECOP_AWARENESS_ENGINE_URL", "http://127.0.0.1:8000");
    vi.stubEnv("ECOP_AWARENESS_ENGINE_API_KEY", "short");
    expect(() => getLiveDemoEngineConfig()).toThrow(/not configured/i);
  });

  it("accepts an HTTP(S) local engine URL but rejects other schemes", () => {
    vi.stubEnv("ECOP_AWARENESS_ENGINE_API_KEY", "x".repeat(32));
    vi.stubEnv("ECOP_AWARENESS_ENGINE_URL", "http://127.0.0.1:8000");
    expect(getLiveDemoEngineConfig().url.origin).toBe("http://127.0.0.1:8000");
    vi.stubEnv("ECOP_AWARENESS_ENGINE_URL", "file:///private/engine");
    expect(() => getLiveDemoEngineConfig()).toThrow(/not configured/i);
  });

  it("requires an explicit non-production local-demo switch", async () => {
    vi.stubEnv("ECOP_DEMO_MODE", "true");
    vi.stubEnv("ECOP_LIVE_DEMO_LOCAL", "true");
    vi.stubEnv("NODE_ENV", "test");
    await expect(requireLiveDemoViewer()).resolves.toEqual({ scope: "local_demo" });
  });
});
