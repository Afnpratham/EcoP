import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  startSessionSchema,
  disposalVerifySchema,
  redeemRewardSchema,
  leaderboardQuerySchema,
  passwordStrength,
} from "@/lib/validations";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({
      email: "test@university.edu",
      password: "Secret123!",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty email", () => {
    const result = loginSchema.safeParse({ email: "", password: "test" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-email",
      password: "test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "test@test.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const validBase = {
    fullName: "Test User",
    email: "test@university.edu",
    password: "MyPass123!",
    confirmPassword: "MyPass123!",
    role: "visitor" as const,
    acceptTerms: true as const,
  };

  it("accepts valid visitor registration", () => {
    const result = registerSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("requires SAP ID for students", () => {
    const result = registerSchema.safeParse({
      ...validBase,
      role: "student",
    });
    expect(result.success).toBe(false);
  });

  it("accepts student with SAP ID", () => {
    const result = registerSchema.safeParse({
      ...validBase,
      role: "student",
      sapId: "500012345",
    });
    expect(result.success).toBe(true);
  });

  it("requires SAP ID for faculty", () => {
    const result = registerSchema.safeParse({
      ...validBase,
      role: "faculty",
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({
      ...validBase,
      confirmPassword: "Different123!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects weak passwords", () => {
    const result = registerSchema.safeParse({
      ...validBase,
      password: "weak",
      confirmPassword: "weak",
    });
    expect(result.success).toBe(false);
  });

  it("rejects without terms acceptance", () => {
    const result = registerSchema.safeParse({
      ...validBase,
      acceptTerms: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects short names", () => {
    const result = registerSchema.safeParse({
      ...validBase,
      fullName: "A",
    });
    expect(result.success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("accepts valid email", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "test@test.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
  });
});

describe("startSessionSchema", () => {
  it("accepts valid bin ID", () => {
    const result = startSessionSchema.safeParse({ binId: "BIN-014" });
    expect(result.success).toBe(true);
  });

  it("rejects empty bin ID", () => {
    const result = startSessionSchema.safeParse({ binId: "" });
    expect(result.success).toBe(false);
  });

  it("rejects bin ID with spaces", () => {
    const result = startSessionSchema.safeParse({ binId: "BIN 014" });
    expect(result.success).toBe(false);
  });

  it("accepts alphanumeric with dashes", () => {
    const result = startSessionSchema.safeParse({ binId: "BIN-014_A" });
    expect(result.success).toBe(true);
  });
});

describe("disposalVerifySchema", () => {
  it("accepts valid payload", () => {
    const result = disposalVerifySchema.safeParse({
      sessionId: "550e8400-e29b-41d4-a716-446655440000",
      result: "success",
      confidence: 0.95,
      timestamp: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it("accepts binId instead of sessionId", () => {
    const result = disposalVerifySchema.safeParse({
      binId: "BIN-014",
      result: "success",
      confidence: 0.95,
      timestamp: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it("rejects payload without sessionId or binId", () => {
    const result = disposalVerifySchema.safeParse({
      result: "success",
      confidence: 0.95,
      timestamp: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid sessionId", () => {
    const result = disposalVerifySchema.safeParse({
      sessionId: "not-a-uuid",
      result: "success",
      confidence: 0.95,
      timestamp: Date.now(),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid result", () => {
    const result = disposalVerifySchema.safeParse({
      sessionId: "550e8400-e29b-41d4-a716-446655440000",
      result: "maybe",
      confidence: 0.5,
      timestamp: Date.now(),
    });
    expect(result.success).toBe(false);
  });

  it("rejects confidence out of range", () => {
    const result = disposalVerifySchema.safeParse({
      sessionId: "550e8400-e29b-41d4-a716-446655440000",
      result: "success",
      confidence: 1.5,
      timestamp: Date.now(),
    });
    expect(result.success).toBe(false);
  });

  it("accepts numeric timestamp", () => {
    const result = disposalVerifySchema.safeParse({
      sessionId: "550e8400-e29b-41d4-a716-446655440000",
      result: "failure",
      confidence: 0.1,
      timestamp: Date.now(),
    });
    expect(result.success).toBe(true);
  });
});

describe("redeemRewardSchema", () => {
  it("accepts valid reward ID", () => {
    const result = redeemRewardSchema.safeParse({
      rewardId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-UUID", () => {
    const result = redeemRewardSchema.safeParse({
      rewardId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});

describe("leaderboardQuerySchema", () => {
  it("accepts valid query params", () => {
    const result = leaderboardQuerySchema.safeParse({
      page: 2,
      pageSize: 10,
      scope: "students",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.pageSize).toBe(10);
      expect(result.data.scope).toBe("students");
    }
  });

  it("applies defaults", () => {
    const result = leaderboardQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(20);
      expect(result.data.scope).toBe("all");
    }
  });

  it("coerces string numbers", () => {
    const result = leaderboardQuerySchema.safeParse({
      page: "3",
      pageSize: "50",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.pageSize).toBe(50);
    }
  });

  it("rejects page < 1", () => {
    const result = leaderboardQuerySchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects pageSize > 100", () => {
    const result = leaderboardQuerySchema.safeParse({ pageSize: 200 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid scope", () => {
    const result = leaderboardQuerySchema.safeParse({ scope: "admins" });
    expect(result.success).toBe(false);
  });
});

describe("passwordStrength", () => {
  it("returns 'Too weak' for empty string", () => {
    expect(passwordStrength("").label).toBe("Too weak");
    expect(passwordStrength("").score).toBe(0);
  });

  it("returns 'Weak' for short password", () => {
    const s = passwordStrength("abcdefgh");
    expect(s.score).toBeLessThanOrEqual(1);
  });

  it("returns 'Strong' for complex password", () => {
    const s = passwordStrength("MyStr0ngP@ssword!");
    expect(s.label).toBe("Strong");
    expect(s.score).toBe(4);
  });

  it("gives higher score for longer passwords", () => {
    const short = passwordStrength("Ab1!");
    const long = passwordStrength("Ab1!Ab1!Ab1!Ab1!");
    expect(long.score).toBeGreaterThanOrEqual(short.score);
  });
});
