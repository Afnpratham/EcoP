"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Hash,
  Shield,
  Leaf,
  Camera,
  Calendar,
  Trophy,
} from "lucide-react";
import { apiFetch } from "@/lib/hooks/useApiMutation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/states";
import { initials, formatDate, nameHue } from "@/lib/utils";
import { toast } from "@/components/ui/toast-store";
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
    created_at: string;
  };
  stats: {
    ecoPoints: number;
    totalDisposals: number;
    totalSessions: number;
    rank: number | null;
  };
  recentTransactions: TransactionRow[];
  achievements: (AchievementRow & { earned: boolean; earnedAt: string | null })[];
}

export default function ProfilePage() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch<DashboardData>("/api/dashboard"),
  });

  function handleAvatarUpload() {
    toast.show({
      title: "Coming Soon",
      description: "Avatar upload will be available in a future update.",
    });
  }

  if (isLoading) return <ProfileSkeleton />;
  if (!data) return <EmptyState title="Profile not found" />;

  const { profile, stats, recentTransactions, achievements } = data;
  const earned = achievements.filter((a) => a.earned);
  const hue = nameHue(profile.full_name);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Profile header */}
      <motion.div
        className="flex flex-col items-center gap-6 sm:flex-row"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="relative">
          <Avatar className="h-24 w-24 text-xl">
            {profile.avatar_url && (
              <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
            )}
            <AvatarFallback
              style={{
                background: `hsl(${hue}, 50%, 88%)`,
                color: `hsl(${hue}, 50%, 30%)`,
              }}
            >
              {initials(profile.full_name)}
            </AvatarFallback>
          </Avatar>
          <Button
            variant="outline"
            size="icon"
            className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
            onClick={handleAvatarUpload}
          >
            <Camera className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="text-center sm:text-left">
          <h1 className="font-display text-2xl font-bold">{profile.full_name}</h1>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <Badge variant="default" className="capitalize">
              {profile.role}
            </Badge>
            <Badge variant="success">
              <Leaf className="mr-1 h-3 w-3" />
              {profile.eco_points.toLocaleString()} pts
            </Badge>
            {stats.rank && (
              <Badge variant="secondary">
                <Trophy className="mr-1 h-3 w-3" />
                Rank #{stats.rank}
              </Badge>
            )}
          </div>
        </div>
      </motion.div>

      {/* Info cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{profile.email}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="text-sm font-medium capitalize">{profile.role}</p>
            </div>
          </CardContent>
        </Card>

        {profile.sap_id && (
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <Hash className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">SAP ID</p>
                <p className="text-sm font-medium">{profile.sap_id}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Member Since</p>
              <p className="text-sm font-medium">
                {formatDate(profile.created_at)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="font-display text-2xl font-bold text-primary">
                {stats.ecoPoints.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Eco Points</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="font-display text-2xl font-bold text-foreground">
                {stats.totalDisposals}
              </p>
              <p className="text-xs text-muted-foreground">Disposals</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="font-display text-2xl font-bold text-foreground">
                {stats.totalSessions}
              </p>
              <p className="text-xs text-muted-foreground">Sessions</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>
            Achievements ({earned.length}/{achievements.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {achievements.length === 0 ? (
            <EmptyState title="No achievements available" />
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {achievements.map((a) => (
                <div
                  key={a.id}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-all ${
                    a.earned
                      ? "border-primary/30 bg-primary/5"
                      : "opacity-30 grayscale"
                  }`}
                  title={`${a.name}: ${a.description}`}
                >
                  <span className="text-2xl">{a.icon}</span>
                  <span className="text-[10px] font-medium leading-tight">
                    {a.name}
                  </span>
                  {a.earnedAt && (
                    <span className="text-[9px] text-muted-foreground">
                      {formatDate(a.earnedAt)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Points history */}
      <Card>
        <CardHeader>
          <CardTitle>Points History</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <EmptyState
              title="No transactions yet"
              description="Start recycling to build your history."
            />
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
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
                        {formatDate(tx.created_at)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={tx.type === "earn" ? "success" : "destructive"}>
                    {tx.type === "earn" ? "+" : "−"}
                    {Math.abs(tx.amount)} pts
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center gap-6">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-40 rounded-xl" />
    </div>
  );
}
