import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { leaderboardQuerySchema } from "@/lib/validations";
import { zodErrorResponse, internalErrorResponse } from "@/lib/api-error";
import type { LeaderboardRow } from "@/types/database";

/**
 * GET /api/leaderboard?page=1&pageSize=20&scope=all
 * Auth: user session (optional — returns currentUserId if authed).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const parsed = leaderboardQuerySchema.safeParse({
      page: searchParams.get("page") ?? 1,
      pageSize: searchParams.get("pageSize") ?? 20,
      scope: searchParams.get("scope") ?? "all",
    });
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const { page, pageSize, scope } = parsed.data;
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let query = supabase.from("leaderboard").select("*", { count: "exact" });

    if (scope !== "all") {
      const roleMap: Record<string, string> = {
        students: "student",
        faculty: "faculty",
        visitors: "visitor",
      };
      const role = roleMap[scope];
      if (role) {
        query = query.eq("role", role);
      }
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const result = await query
      .order("rank", { ascending: true })
      .range(from, to);

    if (result.error) throw result.error;

    const users = (result.data ?? []) as LeaderboardRow[];

    return NextResponse.json({
      users,
      total: result.count ?? 0,
      page,
      pageSize,
      currentUserId: user?.id ?? null,
    });
  } catch (error) {
    return internalErrorResponse(error);
  }
}
