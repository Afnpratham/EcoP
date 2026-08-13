"use client";

import * as React from "react";
import Image from "next/image";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Gift, Loader2, Leaf, ShoppingBag } from "lucide-react";
import { apiFetch } from "@/lib/hooks/useApiMutation";
import { useApiMutation } from "@/lib/hooks/useApiMutation";
import { toast } from "@/components/ui/toast-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/shared/states";
import type { RewardRow } from "@/types/database";

interface RewardsResponse {
  rewards: RewardRow[];
  availablePoints?: number;
}

interface RedeemResponse {
  redemptionId: string;
  rewardId: string;
  pointsSpent: number;
  newTotal: number;
}

export default function RewardsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery<RewardsResponse>({
    queryKey: ["rewards"],
    queryFn: () => apiFetch<RewardsResponse>("/api/rewards"),
    refetchInterval: 2000,
  });

  // Get user's current points from dashboard data
  const dashboardData = queryClient.getQueryData<{ stats: { ecoPoints: number } }>(["dashboard"]);
  const userPoints = data?.availablePoints ?? dashboardData?.stats?.ecoPoints ?? 0;

  const redeemMutation = useApiMutation<{ rewardId: string }, RedeemResponse>(
    "/api/reward/redeem",
  );

  const [redeemingId, setRedeemingId] = React.useState<string | null>(null);

  async function handleRedeem(rewardId: string) {
    setRedeemingId(rewardId);
    try {
      await redeemMutation.mutateAsync({ rewardId });
      toast.success("Reward redeemed successfully!");
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to redeem reward.";
      toast.error(message);
    } finally {
      setRedeemingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-display text-2xl font-bold sm:text-3xl">
          Rewards Store
        </h1>
        <p className="mt-1 text-muted-foreground">
          Exchange your Eco Points for real campus perks.
        </p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
          <Leaf className="h-4 w-4" />
          {userPoints.toLocaleString()} Eco Points available
        </div>
      </motion.div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data?.rewards.length ? (
        <EmptyState
          title="No rewards available"
          description="Check back soon for new rewards."
          icon={<ShoppingBag className="h-6 w-6" />}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.rewards.map((reward, i) => (
            <motion.div
              key={reward.id}
              className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
            >
              {/* Image */}
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                {reward.image_url ? (
                  <Image
                    src={reward.image_url}
                    alt={reward.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <Gift className="h-10 w-10" />
                  </div>
                )}
                <div className="absolute right-3 top-3">
                  <Badge
                    variant={reward.stock > 0 ? "success" : "destructive"}
                    className="shadow-sm"
                  >
                    {reward.stock > 0
                      ? `${reward.stock} left`
                      : "Out of stock"}
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="font-display text-lg font-semibold">
                  {reward.name}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {reward.description}
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Leaf className="h-4 w-4 text-primary" />
                    <span className="font-display text-lg font-bold text-primary">
                      {reward.cost_points}
                    </span>
                    <span className="text-xs text-muted-foreground">pts</span>
                  </div>

                  <Button
                    size="sm"
                    disabled={
                      reward.stock <= 0 ||
                      userPoints < reward.cost_points ||
                      redeemingId === reward.id
                    }
                    onClick={() => handleRedeem(reward.id)}
                    className="gap-1.5"
                  >
                    {redeemingId === reward.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Gift className="h-3.5 w-3.5" />
                    )}
                    Redeem
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
