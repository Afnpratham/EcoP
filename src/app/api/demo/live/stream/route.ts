import {
  engineError,
  engineFetch,
  requireLiveDemoViewer,
} from "@/lib/live-demo";
import { routeError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireLiveDemoViewer();
    const response = await engineFetch("/v1/live/stream", {
      signal: request.signal,
      headers: { Accept: "multipart/x-mixed-replace" },
    });
    if (!response.ok || !response.body) throw await engineError(response);
    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type":
          response.headers.get("content-type") ??
          "multipart/x-mixed-replace; boundary=frame",
        "Cache-Control": "private, no-store",
        "X-Accel-Buffering": "no",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return routeError(error);
  }
}
