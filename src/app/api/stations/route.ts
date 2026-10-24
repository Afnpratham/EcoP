import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/runtime";
import { routeError } from "@/lib/http";
export async function GET() {
  try {
    if (isDemoMode())
      return NextResponse.json({
        mode: "simulation",
        stations: [
          {
            id: "BIN-014",
            location: "Sample library station",
            kind: "disposal",
            status: "active",
            proof_mode: "review",
          },
          {
            id: "REFILL-001",
            location: "Sample refill station",
            kind: "refill",
            status: "active",
            proof_mode: "review",
          },
        ],
      });
    const db = await createSupabaseServerClient();
    const { data, error } = await db.from("bins").select("*").order("id");
    if (error) throw error;
    return NextResponse.json({ stations: data, mode: "live" });
  } catch (error) {
    return routeError(error);
  }
}
