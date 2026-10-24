"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Camera,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Droplets,
  Fingerprint,
  Gauge,
  Leaf,
  PackageCheck,
  RotateCcw,
  Scale,
  ShieldCheck,
  Sparkles,
  Truck,
  Waves,
  XCircle,
} from "lucide-react";

type E = {
  id: string;
  time: string;
  bin: string;
  outcome: "verified" | "suspected_incorrect" | "inconclusive";
  points: number;
  reason: string;
  appealed: boolean;
  reviewed: boolean;
};
type B = {
  id: string;
  time: string;
  massKg: number;
  origin: string;
  state: "collected" | "accepted";
  contamination: string;
};
type R = { id: string; time: string; station: string };
type State = {
  events: E[];
  batches: B[];
  refills: R[];
  statistics: {
    verified: number;
    review: number;
    warnings: number;
    earned: number;
    collectedKg: number;
    acceptedKg: number;
    preventedEstimate: number;
    guidance: string;
  };
};
const scenarios = [
  {
    title: "Confirmed drop",
    desc: "Camera trajectory + beam + load agree",
    vision: true,
    tracked: true,
    beam: true,
    load: true,
  },
  {
    title: "Show and withdraw",
    desc: "Bottle seen, but no deposit evidence",
    vision: true,
    tracked: false,
    beam: false,
    load: false,
  },
  {
    title: "Sensor disagreement",
    desc: "Beam fired; weight evidence conflicts",
    vision: true,
    tracked: true,
    beam: true,
    load: false,
  },
  {
    title: "Beam sensor offline",
    desc: "Missing independent physical proof",
    vision: true,
    tracked: true,
    beam: false,
    load: null,
  },
];
function short(id: string) {
  return id.slice(0, 8).toUpperCase();
}
function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${tone === "good" ? "bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/25" : tone === "warn" ? "bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/25" : "bg-white/10 text-slate-300 ring-1 ring-white/10"}`}
    >
      {children}
    </span>
  );
}
export default function ImpactPage() {
  const [data, setData] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [lastId, setLastId] = useState("");
  const [mass, setMass] = useState("4.5");
  const [origin, setOrigin] = useState("BIN-014");
  const [station, setStation] = useState("Campus water station");
  async function load() {
    try {
      const r = await fetch("/api/impact-demo", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw Error(j.error);
      setData(j);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Unable to load");
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function act(payload: Record<string, unknown>) {
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/impact-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok) throw Error(j.error || "Operation failed");
      setData(j);
      if (payload.action === "verify") setLastId(String(payload.eventId));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Operation failed");
    } finally {
      setBusy(false);
    }
  }
  const s = data?.statistics;
  return (
    <main className="min-h-screen bg-[#071310] text-slate-100 selection:bg-emerald-400/25">
      <div
        className="pointer-events-none fixed inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 60% 35% at 70% -5%, rgba(22,163,119,.22),transparent),radial-gradient(ellipse 35% 40% at 0% 80%,rgba(13,148,136,.12),transparent)",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <nav className="flex items-center justify-between border-b border-white/10 py-6">
          <Link
            href="/"
            className="flex items-center gap-3 text-xl font-bold tracking-tight"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400 text-emerald-950">
              <Leaf size={22} />
            </span>{" "}
            EcoP <span className="text-emerald-400">/</span> Impact OS
          </Link>
          <Badge tone="warn">SIMULATED SYSTEM · NO HARDWARE CONNECTED</Badge>
        </nav>
        <header className="grid gap-8 py-14 lg:grid-cols-[1.3fr_.7fr] lg:items-end">
          <div>
            <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[.24em] text-emerald-300">
              <Sparkles size={14} /> Circular intelligence platform
            </div>
            <h1 className="max-w-4xl text-5xl font-semibold tracking-[-.05em] sm:text-7xl">
              Every disposal.
              <br />
              <span className="text-emerald-400">Proven, not promised.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
              Explore a full lifecycle: multi-signal disposal evidence, fair
              adjudication, verified collection batches, and waste prevention.
              This interactive laboratory uses simulated events and never
              credits real user accounts.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[.07] p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
              <ShieldCheck size={18} /> Privacy-first architecture
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Only event metadata is retained. No face identification, no video
              retention, no automated monetary fines. Uncertain decisions remain
              reviewable.
            </p>
          </div>
        </header>
        {err && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-rose-500/40 bg-rose-500/10 px-5 py-4 text-rose-200"
          >
            {err}
          </div>
        )}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {[
            { label: "Verified events", v: s?.verified ?? 0, icon: BadgeCheck },
            { label: "Review queue", v: s?.review ?? 0, icon: ClipboardCheck },
            { label: "Warnings", v: s?.warnings ?? 0, icon: CircleAlert },
            { label: "Demo points", v: s?.earned ?? 0, icon: Sparkles },
            {
              label: "Collected kg",
              v: (s?.collectedKg ?? 0).toFixed(1),
              icon: Truck,
            },
            {
              label: "Recycler accepted kg",
              v: (s?.acceptedKg ?? 0).toFixed(1),
              icon: PackageCheck,
            },
          ].map(({ label, v, icon: Icon }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-white/[.04] p-5"
            >
              <Icon className="mb-4 text-emerald-400" size={19} />
              <div className="text-3xl font-semibold tracking-tight">{v}</div>
              <div className="mt-1 text-xs text-slate-400">{label}</div>
            </div>
          ))}
        </section>
        <section className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[.04] p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  01 / Proof of disposal
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  Sensor fusion playground
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Try conflicting signals. Only agreement generates a verified
                  demo receipt.
                </p>
              </div>
              <Waves className="text-emerald-400" size={26} />
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {scenarios.map((v, i) => (
                <button
                  key={v.title}
                  disabled={busy}
                  onClick={() =>
                    act({
                      action: "verify",
                      eventId: crypto.randomUUID(),
                      bin: "BIN-014",
                      ...v,
                      title: undefined,
                      desc: undefined,
                    })
                  }
                  className="group rounded-2xl border border-white/10 bg-[#10241d] p-5 text-left transition hover:border-emerald-400/70 hover:bg-[#183b2e] disabled:opacity-50"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300">
                      {i === 0 ? (
                        <CheckCircle2 />
                      ) : i === 1 ? (
                        <Camera />
                      ) : i === 2 ? (
                        <Scale />
                      ) : (
                        <Gauge />
                      )}
                    </span>
                    <ArrowRight
                      className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-emerald-300"
                      size={18}
                    />
                  </div>
                  <div className="font-semibold">{v.title}</div>
                  <div className="mt-1 text-sm leading-snug text-slate-400">
                    {v.desc}
                  </div>
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Rule: vision + temporal tracking + IR break-beam + no
              contradictory load signal. Illustrative decision rule; calibrate
              against real sensor noise before physical deployment.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[.04] p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  02 / Evidence ledger
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  Decision receipts
                </h2>
              </div>
              <Fingerprint className="text-emerald-400" />
            </div>
            <div className="mt-6 max-h-[390px] space-y-3 overflow-y-auto">
              {data?.events.length ? (
                data.events.slice(0, 15).map((e) => (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={e.id}
                    className={`rounded-2xl border p-4 ${lastId === e.id ? "border-emerald-400/40 bg-emerald-400/5" : "border-white/10 bg-[#0b1b15]"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-mono text-slate-400">
                          #{short(e.id)} · {e.bin}
                        </div>
                        <div className="mt-1 text-sm text-slate-300">
                          {e.reason}
                        </div>
                      </div>
                      <Badge
                        tone={
                          e.outcome === "verified"
                            ? "good"
                            : e.outcome === "inconclusive"
                              ? "warn"
                              : "default"
                        }
                      >
                        {e.outcome.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                      <span>{new Date(e.time).toLocaleString()}</span>
                      <span>{e.points ? "+10 points" : "No points"}</span>
                    </div>
                    {e.outcome !== "verified" && !e.appealed && (
                      <button
                        onClick={() => act({ action: "appeal", eventId: e.id })}
                        disabled={busy}
                        className="mt-3 text-xs font-semibold text-emerald-300 underline underline-offset-4"
                      >
                        Request human appeal
                      </button>
                    )}
                    {e.appealed && (
                      <div className="mt-2 text-xs text-amber-300">
                        Appeal requested (demo)
                      </div>
                    )}
                    {e.outcome === "inconclusive" && !e.reviewed && (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() =>
                            act({
                              action: "review",
                              eventId: e.id,
                              approve: true,
                            })
                          }
                          disabled={busy}
                          className="rounded-lg bg-emerald-400/15 px-3 py-2 text-xs text-emerald-200"
                        >
                          Demo reviewer: approve
                        </button>
                        <button
                          onClick={() =>
                            act({
                              action: "review",
                              eventId: e.id,
                              approve: false,
                            })
                          }
                          disabled={busy}
                          className="rounded-lg bg-rose-400/10 px-3 py-2 text-xs text-rose-200"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-slate-400">
                  No evidence yet. Run a scenario to create the first receipt.
                </div>
              )}
            </div>
            <p className="mt-5 text-xs text-amber-200/75">
              Human review buttons emulate an operator. Production requires
              authenticated roles and auditable decisions.
            </p>
          </div>
        </section>
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[.04] p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              03 / Chain of custody
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              Collection → recycler
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Collection is not recycling. Recycler acceptance is recorded as a
              separate event.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <label className="text-xs text-slate-300">
                Origin bin
                <input
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/15 bg-[#071310] px-4 py-3 text-sm outline-none focus:border-emerald-400"
                />
              </label>
              <label className="text-xs text-slate-300">
                Collected mass (kg)
                <input
                  type="number"
                  min=".01"
                  max="1000"
                  step=".1"
                  value={mass}
                  onChange={(e) => setMass(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/15 bg-[#071310] px-4 py-3 text-sm outline-none focus:border-emerald-400"
                />
              </label>
            </div>
            <button
              disabled={busy || !Number(mass) || !origin.trim()}
              onClick={() =>
                act({
                  action: "collect",
                  massKg: Number(mass),
                  origin,
                  contamination: "Not independently checked",
                })
              }
              className="mt-4 w-full rounded-xl bg-emerald-400 px-4 py-3 font-semibold text-emerald-950 hover:bg-emerald-300 disabled:opacity-50"
            >
              Create collection batch
            </button>
            <div className="mt-5 space-y-2">
              {data?.batches.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 p-3"
                >
                  <div>
                    <div className="font-mono text-xs text-slate-400">
                      BATCH-{short(b.id)} · {b.origin}
                    </div>
                    <div className="mt-1 text-sm">
                      {b.massKg} kg ·{" "}
                      {b.state === "accepted"
                        ? "Recycler acceptance recorded"
                        : "Awaiting recycler"}
                    </div>
                  </div>
                  {b.state === "collected" ? (
                    <button
                      disabled={busy}
                      onClick={() => act({ action: "accept", batchId: b.id })}
                      className="rounded-lg bg-emerald-400/15 px-3 py-2 text-xs font-semibold text-emerald-200"
                    >
                      Simulate acceptance
                    </button>
                  ) : (
                    <Badge tone="good">Accepted</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[.04] p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              04 / Reuse first
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              Reward prevention too
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              A refill is a separate category, never mislabeled as recycled
              material. This demo credits a modest 2 points per simulated
              refill; real rewards require station validation and caps.
            </p>
            <label className="mt-6 block text-xs text-slate-300">
              Refill station
              <input
                value={station}
                onChange={(e) => setStation(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/15 bg-[#071310] px-4 py-3 text-sm outline-none focus:border-emerald-400"
              />
            </label>
            <button
              disabled={busy || !station.trim()}
              onClick={() => act({ action: "refill", station })}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 font-semibold text-emerald-950 hover:bg-emerald-300 disabled:opacity-50"
            >
              <Droplets size={18} /> Simulate validated refill · +2
            </button>
            <div className="mt-6 rounded-2xl border border-white/10 bg-[#0b1b15] p-5">
              <div className="text-sm text-slate-400">
                Recorded reuse sessions
              </div>
              <div className="mt-2 text-4xl font-semibold">
                {data?.refills.length ?? 0}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Estimated avoided single-use bottles:{" "}
                {s?.preventedEstimate ?? 0} (one hypothetical bottle per refill;
                not measured recovered mass)
              </div>
            </div>
            <div className="mt-5 rounded-xl bg-emerald-400/10 p-4 text-sm text-emerald-100">
              <Leaf className="mb-2" size={18} />
              Learning tip:{" "}
              {s?.guidance ??
                "Try carrying a reusable bottle. Reducing packaging comes before recycling it."}
            </div>
          </div>
        </section>
        <section className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-8">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Activity size={16} className="text-emerald-300" /> EcoP Impact OS ·
            Event-level verification prototype
          </div>
          <button
            disabled={busy}
            onClick={() => act({ action: "reset" })}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-300 hover:border-emerald-400"
          >
            <RotateCcw size={15} /> Reset demo
          </button>
        </section>
      </div>
    </main>
  );
}
