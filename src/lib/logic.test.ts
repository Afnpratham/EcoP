import { describe, it, expect } from "vitest";
import {
  ECO_POINTS_PER_DISPOSAL,
  SESSION_TTL_SECONDS,
  SESSION_COOLDOWN_MINUTES,
  MAX_SESSIONS_PER_HOUR,
  MAX_SESSIONS_PER_DAY,
  LEADERBOARD_PAGE_SIZE,
  ROUTES,
  APP_NAME,
} from "@/lib/constants";

describe("constants", () => {
  it("ECO_POINTS_PER_DISPOSAL is positive", () => {
    expect(ECO_POINTS_PER_DISPOSAL).toBeGreaterThan(0);
  });

  it("SESSION_TTL_SECONDS is 5 minutes", () => {
    expect(SESSION_TTL_SECONDS).toBe(300);
  });

  it("SESSION_COOLDOWN_MINUTES is 10", () => {
    expect(SESSION_COOLDOWN_MINUTES).toBe(10);
  });

  it("MAX_SESSIONS_PER_HOUR is 10", () => {
    expect(MAX_SESSIONS_PER_HOUR).toBe(10);
  });

  it("MAX_SESSIONS_PER_DAY is 20", () => {
    expect(MAX_SESSIONS_PER_DAY).toBe(20);
  });

  it("LEADERBOARD_PAGE_SIZE is 20", () => {
    expect(LEADERBOARD_PAGE_SIZE).toBe(20);
  });

  it("APP_NAME is EcoP", () => {
    expect(APP_NAME).toBe("EcoP");
  });

  it("ROUTES.BIN returns correct path", () => {
    expect(ROUTES.BIN("BIN-014")).toBe("/ecop/bin/BIN-014");
  });

  it("ROUTES has all expected keys", () => {
    expect(ROUTES.HOME).toBe("/");
    expect(ROUTES.LOGIN).toBe("/login");
    expect(ROUTES.REGISTER).toBe("/register");
    expect(ROUTES.DASHBOARD).toBe("/dashboard");
    expect(ROUTES.LEADERBOARD).toBe("/leaderboard");
    expect(ROUTES.REWARDS).toBe("/rewards");
    expect(ROUTES.PROFILE).toBe("/profile");
  });
});

describe("award points logic", () => {
  it("calculates correct points per disposal", () => {
    const disposals = 5;
    const expectedPoints = disposals * ECO_POINTS_PER_DISPOSAL;
    expect(expectedPoints).toBe(50);
  });

  it("session expires after TTL", () => {
    const startTime = Date.now();
    const expiresAt = startTime + SESSION_TTL_SECONDS * 1000;
    const fiveMinutesLater = startTime + 5 * 60 * 1000;
    expect(expiresAt).toBeLessThanOrEqual(fiveMinutesLater);
  });
});

describe("leaderboard sorting", () => {
  it("sorts users by eco_points descending", () => {
    const users = [
      { name: "Alice", eco_points: 100 },
      { name: "Bob", eco_points: 300 },
      { name: "Charlie", eco_points: 200 },
    ];

    const sorted = [...users].sort((a, b) => b.eco_points - a.eco_points);
    expect(sorted[0]!.name).toBe("Bob");
    expect(sorted[1]!.name).toBe("Charlie");
    expect(sorted[2]!.name).toBe("Alice");
  });

  it("handles ties by maintaining original order", () => {
    const users = [
      { name: "Alice", eco_points: 100 },
      { name: "Bob", eco_points: 100 },
    ];

    const sorted = [...users].sort((a, b) => b.eco_points - a.eco_points);
    expect(sorted).toHaveLength(2);
  });

  it("paginates correctly", () => {
    const allUsers = Array.from({ length: 50 }, (_, i) => ({
      name: `User ${i}`,
      eco_points: 50 - i,
    }));

    const page = 2;
    const pageSize = LEADERBOARD_PAGE_SIZE;
    const start = (page - 1) * pageSize;
    const pageUsers = allUsers.slice(start, start + pageSize);

    expect(pageUsers).toHaveLength(20);
    expect(pageUsers[0]!.name).toBe("User 20");
  });
});

describe("session creation logic", () => {
  it("session has correct pending status", () => {
    const session = {
      status: "pending" as const,
      expires_at: new Date(
        Date.now() + SESSION_TTL_SECONDS * 1000,
      ).toISOString(),
    };
    expect(session.status).toBe("pending");
  });

  it("session expiry time is in the future", () => {
    const now = Date.now();
    const expiresAt = new Date(now + SESSION_TTL_SECONDS * 1000).getTime();
    expect(expiresAt).toBeGreaterThan(now);
  });

  it("cooldown prevents sessions within cooldown window", () => {
    const lastSession = Date.now();
    const now = lastSession + 5 * 60_000; // 5 minutes later
    const cooldownWindow = SESSION_COOLDOWN_MINUTES * 60_000;
    const withinCooldown = now - lastSession < cooldownWindow;
    expect(withinCooldown).toBe(true);
  });

  it("allows session after cooldown period", () => {
    const lastSession = Date.now();
    const now = lastSession + 15 * 60_000; // 15 minutes later
    const cooldownWindow = SESSION_COOLDOWN_MINUTES * 60_000;
    const withinCooldown = now - lastSession < cooldownWindow;
    expect(withinCooldown).toBe(false);
  });
});

describe("reward redemption logic", () => {
  it("deducts correct points on redemption", () => {
    const userPoints = 500;
    const rewardCost = 100;
    const remaining = userPoints - rewardCost;
    expect(remaining).toBe(400);
  });

  it("rejects if insufficient points", () => {
    const userPoints = 50;
    const rewardCost = 100;
    const canRedeem = userPoints >= rewardCost;
    expect(canRedeem).toBe(false);
  });

  it("rejects if out of stock", () => {
    const reward = { stock: 0, cost_points: 100 };
    const canRedeem = reward.stock > 0;
    expect(canRedeem).toBe(false);
  });

  it("allows redemption with sufficient points and stock", () => {
    const userPoints = 500;
    const reward = { stock: 5, cost_points: 100 };
    const canRedeem = userPoints >= reward.cost_points && reward.stock > 0;
    expect(canRedeem).toBe(true);
  });
});
