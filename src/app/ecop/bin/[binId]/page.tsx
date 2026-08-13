"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Recycle,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  QrCode,
  XCircle,
  Camera,
} from "lucide-react";
import { useApiMutation } from "@/lib/hooks/useApiMutation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/toast-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SessionResponse {
  sessionId: string;
  binId: string;
  status: "pending";
  expiresAt: string;
}

interface DisposalSuccessResponse {
  success: boolean;
  pointsAdded: number;
  totalPoints: number;
  message: string;
  duplicate?: boolean;
  retryAfterMs?: number;
}

type VerificationStatus = "pending" | "verified" | "failed" | "expired";

export default function BinPage() {
  const params = useParams();
  const binId = params.binId as string;
  const queryClient = useQueryClient();

  const [session, setSession] = React.useState<SessionResponse | null>(null);
  const [verificationStatus, setVerificationStatus] = React.useState<VerificationStatus>("pending");
  const [cooldownUntil, setCooldownUntil] = React.useState(0);
  const [nowMs, setNowMs] = React.useState(Date.now());
  const mutation = useApiMutation<{ binId: string }, SessionResponse>(
    "/api/session/start",
  );
  const simulationMutation = useApiMutation<
    {
      binId: string;
      dustbinId: string;
      sessionId?: string;
      cycleId: string;
      confidence: number;
      source: string;
    },
    DisposalSuccessResponse
  >("/api/disposal-success");

  const cooldownRemainingMs = Math.max(0, cooldownUntil - nowMs);
  const cooldownRemainingSeconds = Math.ceil(cooldownRemainingMs / 1000);

  // Subscribe to session status changes via Supabase Realtime
  React.useEffect(() => {
    if (!session) return;

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`session:${session.sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${session.sessionId}`,
        },
        (payload) => {
          const newStatus = payload.new?.status as VerificationStatus | undefined;
          if (newStatus && newStatus !== "pending") {
            setVerificationStatus(newStatus);
            if (newStatus === "verified") {
              toast.success("Disposal verified! Eco Points have been credited.");
            } else if (newStatus === "failed") {
              toast.error("Disposal could not be verified. Please try again.");
            } else if (newStatus === "expired") {
              toast.error("Session expired before verification.");
            }
          }
        },
      )
      .subscribe();

    // Also set up expiry timeout based on expiresAt
    const expiresMs = new Date(session.expiresAt).getTime() - Date.now();
    let expiryTimer: ReturnType<typeof setTimeout> | undefined;
    if (expiresMs > 0) {
      expiryTimer = setTimeout(() => {
        setVerificationStatus((prev) => {
          if (prev === "pending") return "expired";
          return prev;
        });
      }, expiresMs);
    }

    return () => {
      supabase.removeChannel(channel);
      if (expiryTimer) clearTimeout(expiryTimer);
    };
  }, [session]);

  React.useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    const timer = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [cooldownUntil]);

  async function handleStartSession() {
    try {
      const result = await mutation.mutateAsync({ binId });
      setSession(result);
      setVerificationStatus("pending");
      toast.success("Disposal session started! Please dispose your item now.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start session.";
      toast.error(message);
    }
  }

  function handleReset() {
    setSession(null);
    setVerificationStatus("pending");
  }

  async function handleSimulateSuccess() {
    try {
      const result = await simulationMutation.mutateAsync({
        binId,
        dustbinId: binId,
        ...(session?.sessionId ? { sessionId: session.sessionId } : {}),
        cycleId: crypto.randomUUID(),
        confidence: 0.97,
        source: "awareness-engine-demo-button",
      });

      if (result.duplicate || !result.success) {
        setCooldownUntil(Date.now() + (result.retryAfterMs ?? 4000));
        toast.error(result.message || "Duplicate detection ignored during cooldown.");
        return;
      }

      setVerificationStatus("verified");
      setCooldownUntil(Date.now() + (result.retryAfterMs ?? 4000));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["rewards"] }),
        queryClient.invalidateQueries({ queryKey: ["leaderboard"] }),
      ]);
      toast.success("Bottle disposed correctly! +10 Eco Points added.");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Could not send the disposal event.";
      toast.error(message);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className="overflow-hidden">
          {/* Header gradient */}
          <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent px-6 pb-8 pt-10 text-center">
            <div className="pointer-events-none absolute -top-10 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-primary/20 blur-[60px]" />
            <div className="relative">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
                <Recycle className="h-8 w-8" />
              </div>
              <h1 className="font-display text-2xl font-bold">Smart Bin</h1>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-sm font-mono font-medium">
                <QrCode className="h-4 w-4 text-primary" />
                {binId}
              </div>
            </div>
          </div>

          <CardContent className="space-y-6 p-6">
            {/* Bin info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-sm font-medium">Campus Area</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-sm font-medium">Ready for Disposal</p>
                </div>
              </div>
            </div>

            {/* Session state */}
            {session ? (
              verificationStatus === "verified" ? (
                <motion.div
                  className="rounded-xl border border-success/30 bg-success/5 p-5 text-center"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-success" />
                  <h3 className="font-display text-lg font-semibold text-success">
                    Disposal Verified!
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your Eco Points have been credited. Thank you for recycling!
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 gap-2"
                    onClick={handleReset}
                  >
                    <Recycle className="h-4 w-4" />
                    Start New Session
                  </Button>
                </motion.div>
              ) : verificationStatus === "failed" || verificationStatus === "expired" ? (
                <motion.div
                  className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-center"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <XCircle className="mx-auto mb-3 h-10 w-10 text-destructive" />
                  <h3 className="font-display text-lg font-semibold text-destructive">
                    {verificationStatus === "expired" ? "Session Expired" : "Verification Failed"}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {verificationStatus === "expired"
                      ? "The session timed out before the item could be verified."
                      : "The AI could not verify proper disposal. Please try again."}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 gap-2"
                    onClick={handleReset}
                  >
                    <Recycle className="h-4 w-4" />
                    Try Again
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  className="rounded-xl border border-success/30 bg-success/5 p-5 text-center"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-primary" />
                  <h3 className="font-display text-lg font-semibold text-primary">
                    Waiting for Verification
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Place your recyclable item in the bin. The AI will verify
                    it automatically.
                  </p>
                  <div className="mt-4 space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Session: <code className="text-xs">{session.sessionId.slice(0, 8)}...</code>
                    </p>
                    <Badge variant="warning">Pending verification</Badge>
                  </div>
                </motion.div>
              )
            ) : (
              <div className="space-y-4">
                {/* Instructions */}
                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <h3 className="mb-2 text-sm font-medium">Instructions</h3>
                  <ol className="space-y-1.5 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">1.</span>
                      Press &quot;Start Disposal Session&quot; below
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">2.</span>
                      Place your recyclable item in the bin
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">3.</span>
                      Wait for AI verification (a few seconds)
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">4.</span>
                      Eco Points are credited automatically
                    </li>
                  </ol>
                </div>

                {/* Start button */}
                <Button
                  size="lg"
                  className="w-full gap-2 text-base shadow-glow"
                  onClick={handleStartSession}
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Recycle className="h-5 w-5" />
                  )}
                  Start Disposal Session
                </Button>

                {mutation.isError && (
                  <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {mutation.error?.message ?? "Failed to start session"}
                  </div>
                )}
              </div>
            )}

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
              <div className="mb-4 flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <Camera className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold">
                    Awareness Engine Demo Mode
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Camera unavailable? Use the same backend disposal endpoint for a safe demo cycle.
                  </p>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full gap-2"
                onClick={handleSimulateSuccess}
                disabled={simulationMutation.isPending || cooldownRemainingMs > 0}
              >
                {simulationMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
                {cooldownRemainingMs > 0
                  ? `Cooldown ${cooldownRemainingSeconds}s`
                  : "Simulate Successful Bottle Disposal"}
              </Button>

              <div className="mt-3 flex items-center justify-between rounded-lg border border-border bg-card/80 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Detection interface</span>
                <Badge variant={cooldownRemainingMs > 0 ? "warning" : "success"}>
                  {cooldownRemainingMs > 0 ? "Locked" : "Running"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
