import { NextResponse } from "next/server";
import { z } from "zod";
import {
  engineError,
  engineFetch,
  requireLiveDemoViewer,
} from "@/lib/live-demo";
import { checkOrigin, readJson, routeError } from "@/lib/http";

const command = z
  .object({
    action: z.enum(["start", "stop"]),
    cameraIndex: z.number().int().min(0).max(16).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.action === "stop" && value.cameraIndex !== undefined)
      ctx.addIssue({ code: "custom", message: "cameraIndex is only valid when starting." });
  });

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    await requireLiveDemoViewer();
    const payload = command.parse(await readJson(request));
    const response = await engineFetch(`/v1/live/${payload.action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body:
        payload.action === "start"
          ? JSON.stringify(
              payload.cameraIndex === undefined
                ? {}
                : { cameraIndex: payload.cameraIndex },
            )
          : "{}",
    });
    if (!response.ok) throw await engineError(response);
    return NextResponse.json(await response.json(), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return routeError(error);
  }
}
