import { NextResponse } from "next/server";
import {
  engineError,
  engineFetch,
  requireLiveDemoViewer,
} from "@/lib/live-demo";
import { routeError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireLiveDemoViewer();
    const response = await engineFetch("/v1/live/status");
    if (!response.ok) throw await engineError(response);
    const body = await response.json();
    return NextResponse.json(body, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return routeError(error);
  }
}
