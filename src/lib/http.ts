import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api-error";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function readJson(
  request: Request,
  maxBytes = 16384,
): Promise<unknown> {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new HttpError(415, "Use application/json.");
  const body = await readBody(request, maxBytes);
  try {
    return JSON.parse(body);
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.");
  }
}
export async function readBody(request: Request, maxBytes = 16384) {
  if (Number(request.headers.get("content-length")) > maxBytes)
    throw new HttpError(413, "Request too large.");
  const reader = request.body?.getReader();
  if (!reader) return "";
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new HttpError(413, "Request too large.");
      }
      parts.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(parts).toString("utf8");
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = new URL(process.env.NEXT_PUBLIC_SITE_URL || request.url)
    .origin;
  if (origin && origin !== expected)
    throw new HttpError(403, "Cross-origin mutation rejected.");
  if (request.headers.get("sec-fetch-site") === "cross-site")
    throw new HttpError(403, "Cross-site mutation rejected.");
}
export async function authenticated() {
  const db = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) throw new HttpError(401, "Sign in to continue.");
  return { db, user };
}
export function routeError(error: unknown) {
  if (error instanceof HttpError)
    return NextResponse.json(
      { error: { code: "REQUEST_REJECTED", message: error.message } },
      { status: error.status },
    );
  if (error instanceof z.ZodError)
    return apiError("VALIDATION_ERROR", "Invalid input.", error.flatten());
  // Never expose provider details, credentials or request bodies.
  console.error(
    "[api] operation failed",
    error instanceof Error ? error.name : "DatabaseError",
  );
  return apiError("INTERNAL_ERROR", "Service unavailable. Please retry.");
}
export function rpcResult(
  data: unknown,
  error: { message?: string; code?: string } | null,
) {
  if (error) {
    const known: Record<string, number> = {
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      CONFLICT: 409,
      EXPIRED: 409,
      RATE_LIMITED: 429,
      INVALID_INPUT: 400,
      INSUFFICIENT_POINTS: 409,
      OUT_OF_STOCK: 409,
    };
    const message = error.message ?? "";
    for (const [key, status] of Object.entries(known))
      if (message.startsWith(key)) throw new HttpError(status, message);
    if (error.code === "23505")
      throw new HttpError(409, "This event has already been recorded.");
    throw error;
  }
  return NextResponse.json(data, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
