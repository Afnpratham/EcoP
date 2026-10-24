import { isDemoMode } from "@/lib/runtime";
import { authenticated, routeError } from "@/lib/http";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { apiError, internalErrorResponse } from "@/lib/api-error";
import {
  buildDemoDashboardPayload,
  getDemoDashboardPayload,
} from "@/lib/demo-store";
import type {
  ProfileRow,
  TransactionRow,
  AchievementRow,
  UserAchievementRow,
  SessionRow,
  LeaderboardRow,
} from "@/types/database";

/**
 * GET /api/dashboard
 * Auth: user session.
 * Returns the authenticated user's dashboard payload:
 *   profile, stats, recent transactions, achievements, recent sessions.
 */
export async function GET() {
  try {
    if (isDemoMode())
      return NextResponse.json({
        ...(await getDemoDashboardPayload()),
        mode: "simulation",
      });
    const { db: supabase, user } = await authenticated();

    // Profile
    const profileResult = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    const profile = profileResult.data as ProfileRow | null;

    if (profileResult.error || !profile) {
      throw profileResult.error ?? new Error("Profile unavailable");
    }

    // Stats
    const { count: totalDisposals } = await supabase
      .from("disposals")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    const { count: totalSessions } = await supabase
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    // Recent transactions (last 10)
    const txResult = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    const recentTransactions = (txResult.data ?? []) as TransactionRow[];

    // User achievements
    const uaResult = await supabase
      .from("user_achievements")
      .select("*")
      .eq("user_id", user.id);
    const userAchievements = (uaResult.data ?? []) as UserAchievementRow[];

    // All achievements
    const achResult = await supabase.from("achievements").select("*");
    const achievements = (achResult.data ?? []) as AchievementRow[];

    // Recent sessions (last 5)
    const sessResult = await supabase
      .from("sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(5);
    const recentSessions = (sessResult.data ?? []) as SessionRow[];

    // Rank from leaderboard view
    const rankResult = await supabase
      .from("leaderboard")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    const rankRow = rankResult.data as LeaderboardRow | null;

    // Weekly points (last 7 days aggregated by day)
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60_000,
    ).toISOString();
    const weeklyResult = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: true });
    const weeklyTxns = (weeklyResult.data ?? []) as TransactionRow[];

    const weeklyPoints: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60_000);
      const key = d.toISOString().slice(0, 10);
      weeklyPoints[key] = 0;
    }
    for (const t of weeklyTxns) {
      if (t.type !== "earn") continue;
      const key = new Date(t.created_at).toISOString().slice(0, 10);
      if (key in weeklyPoints) {
        weeklyPoints[key]! += t.amount;
      }
    }

    for (const result of [
      txResult,
      uaResult,
      achResult,
      sessResult,
      rankResult,
      weeklyResult,
    ])
      if (result.error) throw result.error;
    const payload = {
      profile,
      user: {
        name: profile.full_name,
        email: profile.email,
      },
      ecoPoints: profile.eco_points,
      totalBottles: totalDisposals ?? 0,
      stats: {
        ecoPoints: profile.eco_points,
        totalDisposals: totalDisposals ?? 0,
        totalSessions: totalSessions ?? 0,
        rank: rankRow?.rank ?? null,
      },
      recentTransactions,
      recentActivities: recentTransactions
        .filter((tx) => tx.type === "earn")
        .slice(0, 10)
        .map((tx) => ({
          type: tx.description ?? "Plastic bottle disposed correctly",
          points: tx.amount,
          timestamp: tx.created_at,
        })),
      achievements: achievements.map((a) => ({
        ...a,
        earned: userAchievements.some((ua) => ua.achievement_id === a.id),
        earnedAt:
          userAchievements.find((ua) => ua.achievement_id === a.id)
            ?.earned_at ?? null,
      })),
      recentSessions: recentSessions.map((s) => ({
        id: s.id,
        bin_id: s.bin_id,
        status: s.status,
        started_at: s.started_at,
        verified_at: s.verified_at,
      })),
      weeklyPoints: Object.entries(weeklyPoints).map(([date, points]) => ({
        date,
        points,
      })),
      redemption: {
        availablePoints: profile.eco_points,
        sampleRewards: [],
      },
    };

    return NextResponse.json(payload);
  } catch (error) {
    return routeError(error);
  }
}
