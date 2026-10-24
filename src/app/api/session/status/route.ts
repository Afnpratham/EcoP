import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticated, routeError, HttpError } from "@/lib/http";
export async function GET(request: Request) {
  try {
    const id = z
      .string()
      .uuid()
      .parse(new URL(request.url).searchParams.get("id"));
    const { db } = await authenticated();
    const { data, error } = await db
      .from("sessions")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new HttpError(404, "Session not found.");
    const event = await db
      .from("verification_events")
      .select("id,outcome,reason,points")
      .eq("session_id", id)
      .maybeSingle();
    if (event.error) throw event.error;
    return NextResponse.json(
      {
        ...data,
        status:
          data.status === "pending" && Date.parse(data.expires_at) <= Date.now()
            ? "expired"
            : data.status,
        event: event.data,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return routeError(error);
  }
}
