import { checkOrigin, readJson, routeError } from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { awardDemoDisposal } from "@/lib/demo-store";
import {
  apiError,
  zodErrorResponse,
  internalErrorResponse,
} from "@/lib/api-error";

const disposalSuccessSchema = z.object({
  binId: z.string().min(1).optional(),
  dustbinId: z.string().min(1).optional(),
  sessionId: z.string().min(1).optional(),
  cycleId: z.string().min(1).optional(),
  confidence: z.number().min(0).max(1).optional(),
  source: z.string().min(1).optional(),
  bottlePresent: z.boolean().optional(),
  reset: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  if (process.env.ECOP_DEMO_MODE !== "true") {
    return apiError(
      "FORBIDDEN",
      "Simulation API is disabled outside explicit demo mode.",
    );
  }
  try {
    checkOrigin(request);
    let body: unknown;
    try {
      body = await readJson(request);
    } catch {
      return apiError("VALIDATION_ERROR", "Request body must be valid JSON.");
    }

    const parsed = disposalSuccessSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const result = await awardDemoDisposal(parsed.data);

    return NextResponse.json(result);
  } catch (error) {
    return routeError(error);
  }
}
