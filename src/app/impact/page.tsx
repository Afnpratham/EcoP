"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Fingerprint,
  ArrowUpRight,
  Leaf,
  Droplets,
  PackageCheck,
  ShieldCheck,
} from "lucide-react";
import { apiFetch, useApiMutation } from "@/lib/hooks/useApiMutation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast-store";
import type {
  EvidenceRow,
  AppealRow,
  ReviewRow,
  BatchRow,
} from "@/types/database";
interface ImpactData {
  mode: string;
  userId: string;
  isAdmin: boolean;
  events: EvidenceRow[];
  appeals: AppealRow[];
  reviews: ReviewRow[];
  batches: BatchRow[];
  items: { event_id: string; batch_id: string }[];
  guidance: string;
  limit: number;
}
export default function Impact() {
  const cache = useQueryClient();
  const [tab, setTab] = useState<"receipts" | "traceability" | "review">(
    "receipts",
  );
  const [reason, setReason] = useState<Record<string, string>>({});
  const [bin, setBin] = useState("");
  const [mass, setMass] = useState("");
  const [contamination, setContamination] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [accept, setAccept] = useState<
    Record<string, { mass: string; recycler: string; receipt: string }>
  >({});
  const config = useQuery({
    queryKey: ["config"],
    queryFn: () => apiFetch<{ mode: string }>("/api/config"),
  });
  const query = useQuery({
    queryKey: ["impact"],
    queryFn: () => apiFetch<ImpactData>("/api/impact"),
    enabled: config.data?.mode === "live",
    refetchInterval: 15000,
  });
  const mutation = useApiMutation<Record<string, unknown>, unknown>(
    "/api/impact",
  );
  const data = query.data;
  async function act(body: Record<string, unknown>) {
    try {
      await mutation.mutateAsync(body);
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["impact"] }),
        cache.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      toast.success("Record saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save.");
    }
  }
  if (config.data?.mode === "simulation")
    return (
      <div className="surface mx-auto max-w-2xl p-10">
        <p className="eyebrow">Simulation workspace</p>
        <h1 className="page-title">Explore the impact lab.</h1>
        <p className="my-6 text-muted-foreground">
          This workspace uses sample points. The lab lets you exercise proof,
          appeals, traceability and reuse scenarios without claiming physical
          verification.
        </p>
        <Button asChild>
          <Link href="/lab">
            Open simulation lab <ArrowUpRight size={18} />
          </Link>
        </Button>
      </div>
    );
  if (query.error || config.error)
    return (
      <div role="alert" className="surface p-8">
        <h1 className="text-2xl font-semibold">
          Impact records are unavailable
        </h1>
        <p className="my-3 text-muted-foreground">
          Sign in and check your connection. No simulated data replaces your
          records.
        </p>
        <Button
          onClick={() => {
            config.refetch();
            query.refetch();
          }}
        >
          Retry
        </Button>
      </div>
    );
  if (!data) return <p role="status">Loading your evidence receipts…</p>;
  const own = data.events.filter((e) => e.user_id === data.userId);
  const uncollected = data.events.filter(
    (e) =>
      e.kind === "disposal" &&
      e.outcome === "verified" &&
      !data.items.some((i) => i.event_id === e.id),
  );
  const queue = data.events.filter(
    (e) =>
      e.outcome !== "verified" &&
      !data.reviews.some((r) => r.event_id === e.id),
  );
  const visible = tab === "review" ? queue : own;
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">An impact you can follow</p>
          <h1 className="page-title">Every action has a story.</h1>
          <p className="mt-3 text-muted-foreground">
            Evidence, fair decisions, and the journey beyond the bin.
          </p>
        </div>
        <Button asChild>
          <Link href="/stations">
            Start an action <ArrowUpRight size={17} />
          </Link>
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Verified actions in recent history",
            value: own.filter((e) => e.outcome === "verified").length,
            icon: ShieldCheck,
          },
          {
            label: "Refills in recent history",
            value: own.filter(
              (e) => e.kind === "refill" && e.outcome === "verified",
            ).length,
            icon: Droplets,
          },
          {
            label: "Batches accepted by recycler",
            value: data.batches.filter((b) => b.status === "accepted").length,
            icon: PackageCheck,
          },
        ].map(({ label, value, icon: Icon }) => (
          <div className="surface p-6" key={label}>
            <Icon size={21} className="text-primary" />
            <div className="mt-5 text-4xl font-semibold">{value}</div>
            <p className="mt-2 text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      <aside className="flex gap-4 rounded-2xl bg-primary/10 p-6">
        <Leaf className="shrink-0 text-primary" />
        <div>
          <p className="font-semibold">A little guidance for your next visit</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {data.guidance}
          </p>
        </div>
      </aside>
      <div
        role="tablist"
        aria-label="Impact views"
        className="flex flex-wrap gap-2"
      >
        {(
          [
            "receipts",
            "traceability",
            ...(data.isAdmin ? ["review"] : []),
          ] as const
        ).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t as typeof tab)}
            className={`rounded-full px-5 py-3 text-sm font-medium ${tab === t ? "bg-foreground text-background" : "bg-secondary text-foreground"}`}
          >
            {t === "receipts"
              ? "My receipts"
              : t === "traceability"
                ? "Recycling journey"
                : `Review queue (${queue.length})`}
          </button>
        ))}
      </div>
      {tab !== "traceability" ? (
        <section className="space-y-4" aria-label="Evidence receipts">
          {visible.length === 0 ? (
            <div className="surface p-10 text-center">
              <Fingerprint className="mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-semibold">
                {tab === "review"
                  ? "All caught up"
                  : "Your next action starts here"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {tab === "review"
                  ? "There are no unresolved receipts in this view."
                  : "Visit a station to create your first evidence receipt."}
              </p>
            </div>
          ) : (
            visible.map((e) => {
              const review = data.reviews.find((r) => r.event_id === e.id),
                appeal = data.appeals.find((a) => a.event_id === e.id);
              const item = data.items.find((i) => i.event_id === e.id);
              const batch = data.batches.find((b) => b.id === item?.batch_id);
              return (
                <article key={e.id} className="surface p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="eyebrow">
                        {e.kind === "refill"
                          ? "Refill & reuse"
                          : "Bottle disposal"}{" "}
                        · {new Date(e.received_at).toLocaleString()}
                      </p>
                      <h2 className="mt-2 text-lg font-semibold">{e.reason}</h2>
                      <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
                        Receipt {e.id}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${e.outcome === "verified" ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-950"}`}
                    >
                      {e.outcome} · {e.points} points
                    </span>
                  </div>
                  <details className="mt-4 text-sm">
                    <summary className="cursor-pointer text-muted-foreground">
                      View evidence and custody
                    </summary>
                    <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                      {Object.entries(e.evidence).map(([k, v]) => (
                        <div
                          key={k}
                          className="flex justify-between gap-4 rounded-lg bg-secondary p-2"
                        >
                          <dt>{k}</dt>
                          <dd className="font-mono">
                            {v === null ? "Not installed" : String(v)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-3">
                      {e.kind === "refill"
                        ? "A refill prevents potential waste; it is not recycled mass."
                        : batch
                          ? `Collection batch ${batch.id} · ${batch.status}`
                          : "No collection batch linked yet. Disposal is not a claim of completed recycling."}
                    </p>
                  </details>
                  {review && (
                    <p className="mt-4 rounded-lg bg-secondary p-3 text-sm">
                      Review {review.approved ? "approved" : "declined"}:{" "}
                      {review.reason}
                    </p>
                  )}
                  {appeal && !review && (
                    <p className="mt-4 text-sm text-muted-foreground">
                      Appeal awaiting review: {appeal.reason}
                    </p>
                  )}
                  {e.outcome !== "verified" && !review && (
                    <div className="mt-5 space-y-3">
                      {((tab === "review" && e.user_id !== data.userId) ||
                        (!appeal && e.user_id === data.userId)) && (
                        <label className="block text-sm">
                          {tab === "review"
                            ? "Review rationale"
                            : "Tell us what happened"}
                          <textarea
                            className="mt-2 min-h-20 w-full rounded-xl border bg-background p-3"
                            value={reason[e.id] ?? ""}
                            minLength={10}
                            maxLength={1000}
                            onChange={(v) =>
                              setReason({ ...reason, [e.id]: v.target.value })
                            }
                          />
                        </label>
                      )}
                      {tab === "review" && e.user_id !== data.userId ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            disabled={
                              mutation.isPending ||
                              (reason[e.id]?.trim().length ?? 0) < 10
                            }
                            onClick={() =>
                              act({
                                action: "review",
                                eventId: e.id,
                                approve: true,
                                reason: reason[e.id],
                              })
                            }
                          >
                            Approve evidence
                          </Button>
                          <Button
                            variant="outline"
                            disabled={
                              mutation.isPending ||
                              (reason[e.id]?.trim().length ?? 0) < 10
                            }
                            onClick={() =>
                              act({
                                action: "review",
                                eventId: e.id,
                                approve: false,
                                reason: reason[e.id],
                              })
                            }
                          >
                            Decline with explanation
                          </Button>
                        </div>
                      ) : !appeal && e.user_id === data.userId ? (
                        <Button
                          variant="outline"
                          disabled={
                            mutation.isPending ||
                            (reason[e.id]?.trim().length ?? 0) < 10
                          }
                          onClick={() =>
                            act({
                              action: "appeal",
                              eventId: e.id,
                              reason: reason[e.id],
                            })
                          }
                        >
                          Request human review
                        </Button>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        Uncertainty never deducts your points. Each receipt can
                        be reviewed once.
                      </p>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </section>
      ) : (
        <section className="space-y-5">
          <div className="surface p-6">
            <h2 className="text-xl font-semibold">
              From collection to acceptance
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Collection and recycler acceptance are separate records. Accepted
              mass is reported by operators; it does not establish completed
              material reprocessing.
            </p>
          </div>
          {data.isAdmin && (
            <form
              className="surface space-y-4 p-6"
              onSubmit={(e) => {
                e.preventDefault();
                act({
                  action: "collect",
                  binId: bin,
                  mass: Number(mass),
                  contamination,
                  eventIds: selected,
                });
              }}
            >
              <h2 className="text-xl font-semibold">Record a collection</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="text-sm">
                  Bin ID
                  <Input
                    required
                    value={bin}
                    onChange={(e) => {
                      setBin(e.target.value);
                      setSelected([]);
                    }}
                  />
                </label>
                <label className="text-sm">
                  Measured mass (kg)
                  <Input
                    required
                    type="number"
                    min="0.001"
                    max="1000"
                    step="0.001"
                    value={mass}
                    onChange={(e) => setMass(e.target.value)}
                  />
                </label>
                <label className="text-sm">
                  Contamination notes
                  <Input
                    required
                    maxLength={1000}
                    value={contamination}
                    onChange={(e) => setContamination(e.target.value)}
                  />
                </label>
              </div>
              <fieldset>
                <legend className="mb-2 text-sm">
                  Select the disposal receipts in this collection (same bin)
                </legend>
                <div className="max-h-48 space-y-2 overflow-auto">
                  {uncollected.map((e) => (
                    <label
                      key={e.id}
                      className="flex items-center gap-2 text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(e.id)}
                        onChange={(v) =>
                          setSelected(
                            v.target.checked
                              ? [...selected, e.id]
                              : selected.filter((id) => id !== e.id),
                          )
                        }
                      />
                      <span className="break-all">
                        {e.id} · device {e.device_id}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <Button disabled={mutation.isPending || !selected.length}>
                Create collection record
              </Button>
            </form>
          )}
          {data.batches.length === 0 && (
            <p className="surface p-8 text-muted-foreground">
              No collection records yet.
            </p>
          )}
          {data.batches.map((b) => (
            <article key={b.id} className="surface p-6">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="eyebrow">
                    {b.bin_id} · {b.status}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold">
                    {b.collected_kg} kg collected
                    {b.accepted_kg !== null
                      ? ` → ${b.accepted_kg} kg accepted`
                      : ""}
                  </h3>
                  <p className="mt-2 break-all text-xs text-muted-foreground">
                    Batch {b.id}
                  </p>
                </div>
                <PackageCheck className="text-primary" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Contamination: {b.contamination}
              </p>
              {b.receipt && (
                <p className="mt-2 text-sm">
                  {b.recycler} · receipt {b.receipt}
                </p>
              )}
              {data.isAdmin &&
                b.status === "collected" &&
                b.collector_id !== data.userId && (
                  <form
                    className="mt-5 space-y-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const v = accept[b.id];
                      if (v)
                        act({
                          action: "accept",
                          batchId: b.id,
                          mass: Number(v.mass),
                          recycler: v.recycler,
                          receipt: v.receipt,
                        });
                    }}
                  >
                    <div className="grid gap-3 sm:grid-cols-3">
                      {(["mass", "recycler", "receipt"] as const).map((key) => (
                        <label key={key} className="text-sm">
                          {key === "mass"
                            ? "Accepted mass (kg)"
                            : key === "recycler"
                              ? "Recycler name"
                              : "Receipt reference"}
                          <Input
                            required
                            type={key === "mass" ? "number" : "text"}
                            min={0}
                            max={b.collected_kg}
                            step="0.001"
                            minLength={key === "receipt" ? 5 : undefined}
                            value={accept[b.id]?.[key] ?? ""}
                            onChange={(e) =>
                              setAccept({
                                ...accept,
                                [b.id]: {
                                  ...(accept[b.id] ?? {
                                    mass: "",
                                    recycler: "",
                                    receipt: "",
                                  }),
                                  [key]: e.target.value,
                                },
                              })
                            }
                          />
                        </label>
                      ))}
                    </div>
                    <Button disabled={mutation.isPending}>
                      Confirm recycler acceptance
                    </Button>
                  </form>
                )}
            </article>
          ))}
        </section>
      )}
      <p className="text-xs text-muted-foreground">
        Showing up to {data.limit} recent receipts and batches. Your complete
        history remains in the database.
      </p>
    </div>
  );
}
