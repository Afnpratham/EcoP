import { z } from "zod";

/**
 * Centralized Zod schemas shared by client forms and API route handlers.
 * Keeping them in one place guarantees client and server agree on shape.
 */

// ── Auth ──────────────────────────────────────────────────────────────────

const SPECIAL_CHARS = "!@#$%^&*()-_+=";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password is too long")
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/[a-z]/, "Include at least one lowercase letter")
  .regex(/[0-9]/, "Include at least one number")
  .regex(
    new RegExp(`[${escapeRegex(SPECIAL_CHARS)}]`),
    `Include at least one special character (${SPECIAL_CHARS})`,
  );

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name is too long"),
    email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    role: z.enum(["student", "faculty", "visitor"]),
    sapId: z.string().trim().optional(),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the Terms to continue" }),
    }),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        path: ["confirmPassword"],
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
      });
    }
    const needsSap = data.role === "student" || data.role === "faculty";
    if (needsSap) {
      if (!data.sapId || data.sapId.length < 1) {
        ctx.addIssue({
          path: ["sapId"],
          code: z.ZodIssueCode.custom,
          message: "SAP ID is required for students and faculty",
        });
      } else if (data.sapId.length > 50) {
        ctx.addIssue({
          path: ["sapId"],
          code: z.ZodIssueCode.custom,
          message: "SAP ID must be 50 characters or fewer",
        });
      }
    }
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

// ── Sessions ──────────────────────────────────────────────────────────────

export const startSessionSchema = z.object({
  binId: z
    .string()
    .trim()
    .min(1, "Bin ID is required")
    .max(50, "Bin ID is too long")
    // Allow any printable, non-whitespace token. The DB is authoritative.
    .regex(/^[A-Za-z0-9_-]+$/, "Bin ID has an invalid format"),
});

// ── Disposal verify (webhook from Awareness Engine) ───────────────────────

export const disposalVerifySchema = z
  .object({
    sessionId: z.string().uuid("sessionId must be a valid UUID").optional(),
    binId: z
      .string()
      .trim()
      .min(1, "binId is required when sessionId is not provided")
      .max(50, "binId is too long")
      .regex(/^[A-Za-z0-9_-]+$/, "binId has an invalid format")
      .optional(),
    result: z.enum(["success", "failure"]),
    confidence: z.number().min(0).max(1),
    timestamp: z
      .union([z.string(), z.number()])
      .transform((v) => (typeof v === "number" ? new Date(v) : new Date(v))),
  })
  .refine((data) => Boolean(data.sessionId || data.binId), {
    message: "Either sessionId or binId is required",
    path: ["sessionId"],
  });

// ── Rewards ───────────────────────────────────────────────────────────────

export const redeemRewardSchema = z.object({
  rewardId: z.string().uuid("rewardId must be a valid UUID"),
});

// ── Leaderboard query ─────────────────────────────────────────────────────

export const leaderboardQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  scope: z.enum(["all", "students", "faculty", "visitors"]).default("all"),
});

// ── Helpers ───────────────────────────────────────────────────────────────

/** Escape a string for safe interpolation into a RegExp character class. */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** A 0–100 strength score for a password (pure function, used by tests + UI). */
export function passwordStrength(pw: string): {
  score: 0 | 1 | 2 | 3 | 4;
  label: "Too weak" | "Weak" | "Fair" | "Good" | "Strong";
} {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (new RegExp(`[${escapeRegex(SPECIAL_CHARS)}]`).test(pw)) score++;
  const finalScore = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"] as const;
  return { score: finalScore, label: labels[finalScore] };
}
