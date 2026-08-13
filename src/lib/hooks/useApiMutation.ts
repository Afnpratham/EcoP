"use client";

import { useMutation } from "@tanstack/react-query";

/**
 * Thin wrapper around fetch for our JSON API. Throws on non-2xx so TanStack
 * Query treats it as an error. Returns parsed JSON.
 */
export async function apiFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);

  const res = await fetch(url, {
    ...options,
    signal: options?.signal ?? controller.signal,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  }).finally(() => window.clearTimeout(timeout));

  const data = (await res.json().catch(() => null)) as
    | T
    | { error: { code: string; message: string } }
    | null;

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "error" in data
        ? data.error.message
        : null) ?? "Request failed";
    const code =
      (data && typeof data === "object" && "error" in data
        ? data.error.code
        : null) ?? "UNKNOWN";
    const err = new Error(message) as Error & { code: string };
    err.code = code;
    throw err;
  }

  return data as T;
}

/** useMutation shorthand bound to a POST endpoint. */
export function useApiMutation<TBody, TResponse>(url: string) {
  return useMutation<TResponse, Error & { code: string }, TBody>({
    mutationFn: (body) =>
      apiFetch<TResponse>(url, {
        method: "POST",
        body: JSON.stringify(body),
      }),
  });
}
