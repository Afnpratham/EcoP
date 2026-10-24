"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MapPin, ArrowUpRight, Droplets, Recycle } from "lucide-react";
import { apiFetch } from "@/lib/hooks/useApiMutation";
import type { BinRow } from "@/types/database";
import { Button } from "@/components/ui/button";
export default function Stations() {
  const { data, error, isPending, refetch } = useQuery({
    queryKey: ["stations"],
    queryFn: () =>
      apiFetch<{ stations: BinRow[]; mode: string }>("/api/stations"),
  });
  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Your next small action</p>
        <h1 className="page-title">Find your station.</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Choose a nearby recycling or refill station. Start a session when
          you’re there, then follow its instructions.
        </p>
      </div>
      {error ? (
        <div role="alert" className="surface p-6">
          Stations are unavailable.{" "}
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : isPending ? (
        <p role="status">Loading stations…</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {data?.stations.map((s) => (
            <article key={s.id} className="surface flex flex-col p-7">
              <div className="mb-8 flex items-center justify-between">
                <span className="rounded-2xl bg-primary/10 p-3 text-primary">
                  {s.kind === "refill" ? <Droplets /> : <Recycle />}
                </span>
                <span className="rounded-full border px-3 py-1 text-xs">
                  {s.status}
                </span>
              </div>
              <p className="eyebrow">
                {s.kind === "refill" ? "Refill & reuse" : "Bottle recycling"}
              </p>
              <h2 className="mt-2 text-xl font-semibold">{s.id}</h2>
              <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin size={16} />
                {s.location}
              </p>
              <p className="mb-6 mt-4 text-xs text-muted-foreground">
                {s.proof_mode === "review"
                  ? "Human review before rewards"
                  : s.proof_mode === "fusion"
                    ? "Vision + station sensors"
                    : "Vision verification"}
              </p>
              {s.status === "active" ? (
                <Link
                  className="mt-auto flex items-center justify-between rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
                  href={`/ecop/bin/${encodeURIComponent(s.id)}`}
                >
                  Open station
                  <ArrowUpRight size={18} />
                </Link>
              ) : (
                <p className="mt-auto text-sm text-muted-foreground">
                  Temporarily unavailable
                </p>
              )}
            </article>
          ))}
        </div>
      )}
      {data?.stations.length === 0 && (
        <p className="surface p-8">
          No stations have been provisioned yet. Please check back later.
        </p>
      )}
    </div>
  );
}
