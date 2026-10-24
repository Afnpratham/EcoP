import { HttpError, authenticated } from "@/lib/http";
import { isDemoMode } from "@/lib/runtime";

type EngineConfig = { url: URL; apiKey: string };
export type LiveDemoViewer = { scope: "local_demo" | "admin" };

/**
 * Engine credentials are read only in route handlers.  Client code receives
 * same-origin URLs and never learns the engine host, API key, or device key.
 */
export function getLiveDemoEngineConfig(): EngineConfig {
  const rawUrl = process.env.ECOP_AWARENESS_ENGINE_URL;
  const apiKey = process.env.ECOP_AWARENESS_ENGINE_API_KEY;
  if (!rawUrl || !apiKey || apiKey.length < 32)
    throw new HttpError(503, "Live engine is not configured.");
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new HttpError(503, "Live engine is not configured.");
  }
  if (!["http:", "https:"].includes(url.protocol))
    throw new HttpError(503, "Live engine is not configured.");
  return { url, apiKey };
}

/** Local demo access is explicit and unavailable in production builds. */
export async function requireLiveDemoViewer(): Promise<LiveDemoViewer> {
  if (
    isDemoMode() &&
    process.env.ECOP_LIVE_DEMO_LOCAL === "true" &&
    process.env.NODE_ENV !== "production"
  )
    return { scope: "local_demo" };

  if (isDemoMode())
    throw new HttpError(403, "Live demo access is disabled in simulation mode.");
  const { db, user } = await authenticated();
  const profile = await db
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile.error) throw profile.error;
  if (profile.data?.role !== "admin")
    throw new HttpError(403, "Administrator access is required for the live demo.");
  return { scope: "admin" };
}

export async function engineFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const config = getLiveDemoEngineConfig();
  const target = new URL(path, config.url);
  if (target.origin !== config.url.origin)
    throw new HttpError(500, "Invalid live-engine route.");
  try {
    const headers = new Headers(init.headers);
    headers.set("Accept", headers.get("Accept") ?? "application/json");
    headers.set("X-API-Key", config.apiKey);
    return await fetch(target, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new HttpError(503, "Live engine is unreachable.");
  }
}

export async function engineError(response: Response): Promise<HttpError> {
  let message = "Live engine request failed.";
  try {
    const body = (await response.json()) as { error?: unknown };
    if (typeof body.error === "string" && body.error.length <= 200)
      message = body.error;
  } catch {
    // Do not surface an upstream response body.
  }
  const status = response.status >= 400 && response.status < 500 ? response.status : 503;
  return new HttpError(status, message);
}
