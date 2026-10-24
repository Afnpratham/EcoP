"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MapPin,
  Recycle,
  Droplets,
  CheckCircle2,
  Clock3,
  ScanLine,
} from "lucide-react";
import { apiFetch, useApiMutation } from "@/lib/hooks/useApiMutation";
import { Button } from "@/components/ui/button";
import type { BinRow } from "@/types/database";
type Session = {
  sessionId: string;
  expiresAt: string;
  status: string;
  mode?: string;
};
type Status = {
  status: string;
  event: { outcome: string; reason: string; points: number } | null;
};
export default function BinPage() {
  const { binId } = useParams<{ binId: string }>();
  const cache = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState("");
  const [simulated, setSimulated] = useState(false);
  const [online, setOnline] = useState(true);
  const stations = useQuery({
    queryKey: ["stations"],
    queryFn: () =>
      apiFetch<{ stations: BinRow[]; mode: string }>("/api/stations"),
  });
  const bin = stations.data?.stations.find((b) => b.id === binId);
  const demo = stations.data?.mode === "simulation";
  const start = useApiMutation<{ binId: string }, Session>(
    "/api/session/start",
  );
  const sim = useApiMutation<
    Record<string, unknown>,
    { success: boolean; message: string }
  >("/api/disposal-success");
  useEffect(() => {
    const fn = () => setOnline(navigator.onLine);
    fn();
    window.addEventListener("online", fn);
    window.addEventListener("offline", fn);
    return () => {
      window.removeEventListener("online", fn);
      window.removeEventListener("offline", fn);
    };
  }, []);
  const status = useQuery({
    queryKey: ["session", session?.sessionId],
    queryFn: () =>
      apiFetch<Status>(`/api/session/status?id=${session!.sessionId}`),
    enabled: !!session && !demo,
    refetchInterval: (q) =>
      q.state.data?.status === "pending" || !q.state.data ? 2500 : false,
  });
  const resolved = simulated
    ? "verified"
    : (status.data?.event?.outcome ?? status.data?.status ?? "pending");
  useEffect(() => {
    if (resolved !== "pending")
      cache.invalidateQueries({ queryKey: ["dashboard"] });
  }, [resolved, cache]);
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/stations" className="text-sm text-muted-foreground">
        ← All stations
      </Link>
      <section className="surface overflow-hidden">
        <div className="bg-[#123e32] px-7 py-10 text-white">
          <span className="inline-flex rounded-2xl bg-white/10 p-4">
            {bin?.kind === "refill" ? (
              <Droplets size={30} />
            ) : (
              <Recycle size={30} />
            )}
          </span>
          <p className="mt-6 text-xs uppercase tracking-[.2em] text-emerald-200">
            {bin?.kind === "refill" ? "Refill & reuse" : "Proof of disposal"}
          </p>
          <h1 className="mt-2 text-4xl font-semibold">{binId}</h1>
          <p className="mt-3 flex items-center gap-2 text-sm text-emerald-100">
            <MapPin size={17} />
            {bin?.location ?? "Loading station information…"}
          </p>
        </div>
        <div className="space-y-6 p-7">
          {stations.error ? (
            <p role="alert">
              Station information is unavailable.{" "}
              <button className="underline" onClick={() => stations.refetch()}>
                Retry
              </button>
            </p>
          ) : stations.isPending ? (
            <p role="status">Loading…</p>
          ) : !bin ? (
            <p role="alert">
              This station was not found. Check the QR code or choose a listed
              station.
            </p>
          ) : bin.status !== "active" ? (
            <p>This station is {bin.status}. Please use another station.</p>
          ) : session ? (
            <div aria-live="polite" className="space-y-4">
              <div className="flex items-center gap-3">
                {resolved === "verified" ? (
                  <CheckCircle2 className="text-primary" />
                ) : (
                  <Clock3 className="text-primary" />
                )}
                <h2 className="text-2xl font-semibold">
                  {resolved === "verified"
                    ? demo
                      ? "Simulation recorded"
                      : "Action verified"
                    : resolved === "inconclusive"
                      ? "Your action needs a review"
                      : resolved === "expired"
                        ? "This session has expired"
                        : resolved === "rejected"
                          ? "Evidence was not sufficient"
                          : "Ready when you are"}
                </h2>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {status.data?.event?.reason ??
                  (resolved === "verified"
                    ? "Your points balance has been updated."
                    : "Complete your action at this station. Keep the area clear for verification. Your session is bound to your account; no face recognition is used.")}
              </p>
              <p className="break-all font-mono text-xs text-muted-foreground">
                Session {session.sessionId}
                <br />
                Expires {new Date(session.expiresAt).toLocaleTimeString()}
              </p>
              {status.error && (
                <p role="alert" className="text-sm text-destructive">
                  We can’t confirm the current status. Reconnect to refresh; no
                  reward is assumed.
                </p>
              )}
              {resolved !== "pending" && (
                <div className="flex flex-wrap gap-2">
                  <Button asChild>
                    <Link href={demo ? "/dashboard" : "/impact"}>
                      View {demo ? "sample balance" : "receipt"}
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSession(null);
                      setSimulated(false);
                    }}
                  >
                    New session
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-semibold">
                One action. A clear receipt.
              </h2>
              <ol className="space-y-4 text-sm text-muted-foreground">
                {[
                  "Start a session only when you’re at this station.",
                  bin.kind === "refill"
                    ? "Place your reusable bottle at the refill outlet."
                    : "Place one empty bottle through the marked opening.",
                  "Wait for your receipt. Uncertain evidence can be reviewed.",
                ].map((s, i) => (
                  <li key={s} className="flex gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
              <Button
                className="w-full"
                size="lg"
                disabled={start.isPending || !online}
                onClick={async () => {
                  setError("");
                  try {
                    setSession(await start.mutateAsync({ binId }));
                  } catch (e) {
                    setError(
                      e instanceof Error
                        ? e.message
                        : "Could not start session.",
                    );
                  }
                }}
              >
                <ScanLine size={18} />
                {start.isPending
                  ? "Starting…"
                  : `Start ${bin.kind === "refill" ? "refill" : "disposal"} session`}
              </Button>
              <p className="text-xs text-muted-foreground">
                {bin.proof_mode === "review"
                  ? "This station requires human review before points are awarded."
                  : "Verification follows this station’s configured evidence policy."}
              </p>
            </>
          )}
          {demo &&
            session &&
            resolved === "pending" &&
            bin?.kind !== "refill" && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
                <h3 className="font-semibold">Simulation only</h3>
                <p className="my-2 text-sm">
                  This button creates a sample disposal, without camera or
                  sensor evidence.
                </p>
                <Button
                  variant="outline"
                  disabled={sim.isPending || !online}
                  onClick={async () => {
                    setError("");
                    try {
                      const r = await sim.mutateAsync({
                        binId,
                        sessionId: session.sessionId,
                        cycleId: session.sessionId,
                        source: "explicit-local-simulation",
                      });
                      if (!r.success) throw new Error(r.message);
                      setSimulated(true);
                    } catch (e) {
                      setError(
                        e instanceof Error ? e.message : "Simulation failed",
                      );
                    }
                  }}
                >
                  Simulate disposal
                </Button>
              </div>
            )}
          {demo && bin?.kind === "refill" && (
            <p className="text-sm">
              Use the{" "}
              <Link href="/lab" className="underline">
                simulation lab
              </Link>{" "}
              to exercise refill evidence.
            </p>
          )}
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive"
            >
              {error}
              {error.includes("Sign in") && (
                <>
                  {" "}
                  <Link
                    href={`/login?redirect=/ecop/bin/${encodeURIComponent(binId)}`}
                    className="underline"
                  >
                    Log in
                  </Link>
                </>
              )}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
