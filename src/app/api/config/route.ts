import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/runtime";
export async function GET() {
  return NextResponse.json({ mode: isDemoMode() ? "simulation" : "live" });
}
