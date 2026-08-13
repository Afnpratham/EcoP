"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Trophy, Medal, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { apiFetch } from "@/lib/hooks/useApiMutation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { initials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { LeaderboardRow } from "@/types/database";

interface LeaderboardResponse {
  users: LeaderboardRow[];
  total: number;
  page: number;
  pageSize: number;
  currentUserId: string | null;
}

const SCOPES = [
  { value: "all", label: "All" },
  { value: "students", label: "Students" },
  { value: "faculty", label: "Faculty" },
  { value: "visitors", label: "Visitors" },
] as const;

function rankIcon(rank: number) {
  if (rank === 1)
    return (
      <div className="grid h-8 w-8 place-items-center rounded-full bg-amber-400/20">
        <Trophy className="h-4 w-4 text-amber-500" />
      </div>
    );
  if (rank === 2)
    return (
      <div className="grid h-8 w-8 place-items-center rounded-full bg-gray-300/20">
        <Medal className="h-4 w-4 text-gray-400" />
      </div>
    );
  if (rank === 3)
    return (
      <div className="grid h-8 w-8 place-items-center rounded-full bg-amber-700/20">
        <Medal className="h-4 w-4 text-amber-700" />
      </div>
    );
  return (
    <div className="grid h-8 w-8 place-items-center text-sm font-bold text-muted-foreground">
      {rank}
    </div>
  );
}

export default function LeaderboardPage() {
  const [page, setPage] = React.useState(1);
  const [scope, setScope] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");
  const pageSize = 20;

  const { data, isLoading, error, refetch } = useQuery<LeaderboardResponse>({
    queryKey: ["leaderboard", page, scope],
    queryFn: () =>
      apiFetch<LeaderboardResponse>(
        `/api/leaderboard?page=${page}&pageSize=${pageSize}&scope=${scope}`,
      ),
  });

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  const filtered = React.useMemo(() => {
    if (!data?.users || !search) return data?.users ?? [];
    const q = search.toLowerCase();
    return data.users.filter((u) =>
      u.full_name.toLowerCase().includes(q),
    );
  }, [data?.users, search]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-display text-2xl font-bold sm:text-3xl">
          Leaderboard
        </h1>
        <p className="mt-1 text-muted-foreground">
          See who&apos;s leading the sustainability charge.
        </p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {SCOPES.map((s) => (
            <button
              key={s.value}
              onClick={() => {
                setScope(s.value);
                setPage(1);
              }}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm font-medium transition-all",
                scope === s.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <ErrorState onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No users found"
          description={
            search
              ? "Try a different search query."
              : "No one on the leaderboard yet."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border bg-muted/50 px-6 py-3">
            <div className="grid grid-cols-12 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <span className="col-span-1">Rank</span>
              <span className="col-span-7">User</span>
              <span className="col-span-2 text-center">Role</span>
              <span className="col-span-2 text-right">Points</span>
            </div>
          </div>

          <div className="divide-y divide-border">
            {filtered.map((user, i) => {
              const isCurrentUser = data?.currentUserId === user.id;
              return (
                <motion.div
                  key={user.id}
                  className={cn(
                    "grid grid-cols-12 items-center px-6 py-4 transition-colors hover:bg-muted/30",
                    isCurrentUser && "bg-primary/5 ring-1 ring-inset ring-primary/20",
                  )}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.3 }}
                >
                  <div className="col-span-1">{rankIcon(user.rank)}</div>
                  <div className="col-span-7 flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      {user.avatar_url && (
                        <AvatarImage src={user.avatar_url} alt={user.full_name} />
                      )}
                      <AvatarFallback className="text-xs">
                        {initials(user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {user.full_name}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-primary">(You)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="col-span-2 text-center">
                    <Badge variant="secondary" className="capitalize">
                      {user.role}
                    </Badge>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="font-display text-sm font-bold text-primary">
                      {user.eco_points.toLocaleString()}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
