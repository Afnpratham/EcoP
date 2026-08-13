import { describe, it, expect } from "vitest";
import {
  initials,
  timeAgo,
  formatDate,
  formatDateTime,
  formatWeight,
  clamp,
  percent,
  nameHue,
  cn,
} from "@/lib/utils";

describe("initials", () => {
  it("returns two-letter initials from a full name", () => {
    expect(initials("Jane Doe")).toBe("JD");
  });

  it("returns first two letters for single name", () => {
    expect(initials("Jane")).toBe("JA");
  });

  it("returns '?' for null/undefined", () => {
    expect(initials(null)).toBe("?");
    expect(initials(undefined)).toBe("?");
    expect(initials("")).toBe("?");
  });

  it("handles three-word names", () => {
    expect(initials("John Michael Doe")).toBe("JD");
  });

  it("trims whitespace", () => {
    expect(initials("  Jane Doe  ")).toBe("JD");
  });
});

describe("clamp", () => {
  it("returns value if within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("clamps to min", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("clamps to max", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe("percent", () => {
  it("returns correct percentage", () => {
    expect(percent(50, 200)).toBe(25);
  });

  it("returns 0 for zero total", () => {
    expect(percent(50, 0)).toBe(0);
  });

  it("clamps to 100", () => {
    expect(percent(200, 100)).toBe(100);
  });

  it("clamps to 0", () => {
    expect(percent(-10, 100)).toBe(0);
  });
});

describe("formatWeight", () => {
  it("formats grams", () => {
    expect(formatWeight(500)).toBe("500 g");
  });

  it("formats kilograms", () => {
    expect(formatWeight(1500)).toBe("1.50 kg");
  });

  it("formats exact 1kg", () => {
    expect(formatWeight(1000)).toBe("1.00 kg");
  });
});

describe("nameHue", () => {
  it("returns 142 for null/undefined", () => {
    expect(nameHue(null)).toBe(142);
    expect(nameHue(undefined)).toBe(142);
  });

  it("returns a number 0-359", () => {
    const hue = nameHue("Test User");
    expect(hue).toBeGreaterThanOrEqual(0);
    expect(hue).toBeLessThan(360);
  });

  it("is deterministic", () => {
    expect(nameHue("Alice")).toBe(nameHue("Alice"));
  });

  it("produces different values for different names", () => {
    expect(nameHue("Alice")).not.toBe(nameHue("Bob"));
  });
});

describe("cn", () => {
  it("merges class names", () => {
    const result = cn("px-2", "py-3");
    expect(result).toContain("px-2");
    expect(result).toContain("py-3");
  });

  it("handles conditional classes", () => {
    const result = cn("base", false && "hidden");
    expect(result).toBe("base");
  });
});

describe("timeAgo", () => {
  it("returns seconds ago for very recent", () => {
    const now = new Date().toISOString();
    const result = timeAgo(now);
    expect(result).toMatch(/\d+s ago/);
  });
});

describe("formatDate", () => {
  it("formats a date string", () => {
    const result = formatDate("2024-06-15T10:30:00Z");
    expect(result).toContain("Jun");
    expect(result).toContain("15");
    expect(result).toContain("2024");
  });
});

describe("formatDateTime", () => {
  it("formats a date+time string", () => {
    const result = formatDateTime("2024-06-15T10:30:00Z");
    expect(result).toContain("Jun");
    expect(result).toContain("15");
  });
});
