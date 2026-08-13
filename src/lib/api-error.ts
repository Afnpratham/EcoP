import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Canonical error envelope used by every API route.
 * Shape: { error: { code, message } } (+ optional `details`).
 */
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "BIN_NOT_FOUND"
  | "BIN_INACTIVE"
  | "SESSION_NOT_FOUND"
  | "SESSION_EXPIRED"
  | "SESSION_ALREADY_RESOLVED"
  | "REWARD_NOT_FOUND"
  | "INSUFFICIENT_POINTS"
  | "OUT_OF_STOCK"
  | "COOLDOWN_ACTIVE"
  | "RATE_LIMITED"
  | "INVALID_SIGNATURE"
  | "INTERNAL_ERROR";

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  INVALID_SIGNATURE: 401,
  FORBIDDEN: 403,
  BIN_NOT_FOUND: 404,
  SESSION_NOT_FOUND: 404,
  REWARD_NOT_FOUND: 404,
  BIN_INACTIVE: 409,
  SESSION_ALREADY_RESOLVED: 409,
  COOLDOWN_ACTIVE: 409,
  INSUFFICIENT_POINTS: 409,
  OUT_OF_STOCK: 409,
  RATE_LIMITED: 429,
  SESSION_EXPIRED: 410,
  INTERNAL_ERROR: 500,
};

/** Build a canonical error Response. */
export function apiError(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>,
): NextResponse {
  const status = STATUS_BY_CODE[code];
  const body: { error: ApiError } = {
    error: { code, message, ...(details ? { details } : {}) },
  };
  return NextResponse.json(body, { status });
}

/** Build a canonical success Response. */
export function apiSuccess<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

/** Turn a ZodError into a 400 VALIDATION_ERROR response. */
export function zodErrorResponse(error: ZodError): NextResponse {
  return apiError(
    "VALIDATION_ERROR",
    error.errors[0]?.message ?? "Invalid request body",
    {
      issues: error.errors.map((e) => ({ path: e.path, message: e.message })),
    },
  );
}

/** Safely log + return a 500 for unexpected errors (no internals in body). */
export function internalErrorResponse(error: unknown): NextResponse {
  // eslint-disable-next-line no-console
  console.error("[api] internal error", error);
  return apiError("INTERNAL_ERROR", "Something went wrong. Please try again.");
}
