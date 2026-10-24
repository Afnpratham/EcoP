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
    const response = await engineFetch("/v1/live/events", {
      signal: request.signal,
      headers: { Accept: "text/event-stream" },
    });
    if (!response.ok || !response.body) throw await engineError(response);
    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "private, no-store",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return routeError(error);
  }
}
