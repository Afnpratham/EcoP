import { NextResponse } from "next/server";
import { authenticated, routeError } from "@/lib/http";
import { getDemoStore } from "@/lib/demo-store";
import { isDemoMode } from "@/lib/runtime";
export async function GET() {
  try {
    if (isDemoMode()) {
      const s = await getDemoStore();
      return NextResponse.json({
        rewards: s.rewards.filter((r) => r.active),
        availablePoints: s.user.eco_points,
        redemptions: s.redemptions,
        mode: "simulation",
        isAdmin: false,
      });
    }
    const { db, user } = await authenticated();
    const [rewards, profile, redemptions] = await Promise.all([
      db.from("rewards").select("*").eq("active", true).order("cost_points"),
      db.from("profiles").select("eco_points,role").eq("id", user.id).single(),
      db
        .from("redemptions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    for (const r of [rewards, profile, redemptions]) if (r.error) throw r.error;
    return NextResponse.json({
      rewards: rewards.data,
      availablePoints: profile.data?.eco_points,
      redemptions: redemptions.data,
      isAdmin: profile.data?.role === "admin",
      userId: user.id,
      mode: "live",
    });
  } catch (error) {
    return routeError(error);
  }
}
