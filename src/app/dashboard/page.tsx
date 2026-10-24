"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Leaf,
  Trophy,
  Recycle,
  Gift,
  ArrowRight,
  QrCode,
  TrendingUp,
} from "lucide-react";
import { apiFetch } from "@/lib/hooks/useApiMutation";
import { useRealtimePoints } from "@/lib/hooks/useRealtimePoints";
import { toast } from "@/components/ui/toast-store";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/states";
import { ROUTES } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { TransactionRow, AchievementRow } from "@/types/database";

interface DashboardData {
  profile: {
    id: string;
    full_name: string;
    email: string;
    role: string;
    sap_id: string | null;
    avatar_url: string | null;
    eco_points: number;
  };
  stats: {
    ecoPoints: number;
    totalDisposals: number;
    totalSessions: number;
    rank: number | null;
  };
  recentTransactions: TransactionRow[];
  achievements: (AchievementRow & {
    earned: boolean;
    earnedAt: string | null;
  })[];
  recentSessions: {
    id: string;
    bin_id: string;
    status: string;
    started_at: string;
    verified_at: string | null;
  }[];
  weeklyPoints: { date: string; points: number }[];
  redemption?: {
    availablePoints: number;
    sampleRewards: Array<{
      id: string;
      name: string;
      cost_points: number;
      stock: number;
    }>;
  };
}

export default function DashboardPage() {
  const latestPointsRef = React.useRef<number | null>(null);
  const { data, isLoading, error, refetch } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch<DashboardData>("/api/dashboard"),
    refetchInterval: 15000,
    retry: 1,
    staleTime: 500,
  });

  useRealtimePoints(data?.profile?.id);

  React.useEffect(() => {
    if (!data) return;
    const nextPoints = data.stats.ecoPoints;
    const previousPoints = latestPointsRef.current;
    latestPointsRef.current = nextPoints;

    if (previousPoints !== null && nextPoints > previousPoints) {
      toast.success(
        `Balance updated: +${nextPoints - previousPoints} Eco Points added.`,
      );
    }
  }, [data]);

  if (isLoading) return <DashboardSkeleton />;

  if (error || !data) {
    return (
      <div className="py-12">
        <EmptyState
          title="Could not load dashboard"
          description="Something went wrong. Please try again."
          action={{ label: "Retry", onClick: () => refetch() }}
        />
      </div>
    );
  }

  const {
    profile,
    stats,
    recentTransactions,
    achievements,
    recentSessions,
    weeklyPoints,
    redemption,
  } = data;
  const earnedBadges = achievements.filter((a) => a.earned);

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-display text-2xl font-bold sm:text-3xl">
          Welcome back, {profile.full_name.split(" ")[0]}!
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here&apos;s your sustainability dashboard.
        </p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Eco Points" value={stats.ecoPoints} icon={<Leaf />} />
        <StatCard
          label="Current Rank"
          value={stats.rank ?? 0}
          format={(n) => (n > 0 ? `#${Math.round(n)}` : "–")}
          icon={<Trophy />}
        />
        <StatCard
          label="Disposals"
          value={stats.totalDisposals}
          icon={<Recycle />}
        />
        <StatCard
          label="Sessions"
          value={stats.totalSessions}
          icon={<QrCode />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Weekly points chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Weekly Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyPoints.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={weeklyPoints}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: string) => {
                      const d = new Date(v + "T00:00:00");
                      return d.toLocaleDateString("en-US", {
                        weekday: "short",
                      });
                    }}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="points"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                title="No activity yet"
                description="Start recycling to see your weekly progress!"
              />
            )}
          </CardContent>
        </Card>

        {/* Achievement badges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {achievements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No achievements yet.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {achievements.map((a) => (
                  <div
                    key={a.id}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-opacity ${
                      a.earned ? "border-primary/30 bg-primary/5" : "opacity-40"
                    }`}
                    title={a.description}
                  >
                    <span className="text-2xl">{a.icon}</span>
                    <span className="text-[10px] font-medium leading-tight">
                      {a.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {earnedBadges.length > 0 && (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                {earnedBadges.length} of {achievements.length} earned
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <EmptyState
                title="No transactions yet"
                description="Recycle to earn your first Eco Points."
              />
            ) : (
              <div className="space-y-3">
                {recentTransactions.slice(0, 6).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${
                          tx.type === "earn"
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {tx.type === "earn" ? "+" : "−"}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {tx.description ?? tx.type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {timeAgo(tx.created_at)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={tx.type === "earn" ? "success" : "destructive"}
                    >
                      {tx.type === "earn" ? "+" : "−"}
                      {Math.abs(tx.amount)} pts
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Redeem Points
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Available balance</p>
              <p className="font-display text-3xl font-bold text-primary">
                {(
                  redemption?.availablePoints ?? stats.ecoPoints
                ).toLocaleString()}
                <span className="ml-1 text-sm font-medium text-muted-foreground">
                  pts
                </span>
              </p>
            </div>
            {redemption?.sampleRewards?.length ? (
              <div className="space-y-2">
                {redemption.sampleRewards.slice(0, 3).map((reward) => (
                  <div
                    key={reward.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card/80 px-3 py-2"
                  >
                    <span className="text-sm font-medium">{reward.name}</span>
                    <Badge
                      variant={
                        stats.ecoPoints >= reward.cost_points
                          ? "success"
                          : "secondary"
                      }
                    >
                      {reward.cost_points} pts
                    </Badge>
                  </div>
                ))}
              </div>
            ) : null}
            <Button asChild className="w-full gap-2">
              <Link href={ROUTES.REWARDS}>
                <Gift className="h-4 w-4" />
                Redeem Points
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent QR sessions */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>QR Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSessions.length === 0 ? (
              <EmptyState
                title="No sessions yet"
                description="Scan a bin QR code to start."
              />
            ) : (
              <div className="space-y-3">
                {recentSessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{s.bin_id}</p>
                      <p className="text-xs text-muted-foreground">
                        {timeAgo(s.started_at)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        s.status === "verified"
                          ? "success"
                          : s.status === "pending"
                            ? "warning"
                            : "destructive"
                      }
                    >
                      {s.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Scan Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Walk up to any EcoP smart bin, scan the QR code with your phone
                camera, and dispose responsibly. Points are credited instantly
                after AI verification.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="gap-2">
                <Link href={ROUTES.REWARDS}>
                  <Gift className="h-4 w-4" />
                  Rewards
                </Link>
              </Button>
              <Button asChild className="gap-2">
                <Link href={ROUTES.LEADERBOARD}>
                  <Trophy className="h-4 w-4" />
                  Leaderboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-60" />
        <Skeleton className="mt-2 h-4 w-40" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}
