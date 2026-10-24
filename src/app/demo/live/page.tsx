"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bot,
  Camera,
  CircleStop,
  Gauge,
  ListVideo,
  LoaderCircle,
  Play,
  Radio,
  RefreshCw,
  ShieldCheck,
  TimerReset,
  Trash2,
  WifiOff,
} from "lucide-react";

type Quality = {
  brightness: number;
  contrast: number;
  sharpness: number;
  low_light: boolean;
  enhanced: boolean;
};
type EngineEvent = {
  event_id: string;
  event_type: string;
  timestamp: number;
  message: string;
  track_id?: number | null;
  payload?: { verification_outcome?: string; confidence?: number };
};
type LiveStatus = {
  state: "stopped" | "starting" | "running" | "stopping" | "failed";
  error: string | null;
  model: string;
  cameraIndex: number | null;
  allowedCameraIndices: number[];
  lastFrameAt: string | null;
  frameFresh: boolean;
  trackedBottles: number;
  quality: Quality | null;
  stats: {
    camera_fps: number;
    inference_fps: number;
    tracking_fps: number;
    rendering_fps: number;
    average_inference_ms: number;
    average_tracking_ms: number;
    average_render_ms: number;
    end_to_end_latency_ms: number;
  };
  eventCounts: Record<string, number>;
  observationOnly: boolean;
  sessionVerification: string;
  pointsAwarded: number;
  reviewUpdates: number;
  verifiedDisposals: number;
  candidateDisposals: number;
};
type EngineResponse = {
  success: boolean;
  live?: LiveStatus;
  error?: string | { message?: string };
};

const initialStatus: LiveStatus = {
  state: "stopped",
  error: null,
  model: "yolo11n",
  cameraIndex: null,
  allowedCameraIndices: [],
  lastFrameAt: null,
  frameFresh: false,
  trackedBottles: 0,
  quality: null,
  stats: {
    camera_fps: 0,
    inference_fps: 0,
    tracking_fps: 0,
    rendering_fps: 0,
    average_inference_ms: 0,
    average_tracking_ms: 0,
    average_render_ms: 0,
    end_to_end_latency_ms: 0,
  },
  eventCounts: {},
  observationOnly: true,
  sessionVerification: "not_submitted",
  pointsAwarded: 0,
  reviewUpdates: 0,
  verifiedDisposals: 0,
  candidateDisposals: 0,
};

function number(value: number, digits = 1) {
  return Number.isFinite(value) ? value.toFixed(digits) : "—";
}

function eventTone(event: EngineEvent) {
  if (event.event_type === "ERROR_OCCURRED") return "text-destructive";
  if (event.event_type.includes("INCORRECT")) return "text-amber-600 dark:text-amber-300";
  if (event.event_type.includes("DISPOSED")) return "text-primary";
  return "text-foreground";
}

export default function LiveDemoPage() {
  const [status, setStatus] = useState<LiveStatus>(initialStatus);
  const [events, setEvents] = useState<EngineEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [streamError, setStreamError] = useState(false);
  const sourceRef = useRef<EventSource | null>(null);
  const retryRef = useRef<number | null>(null);
  const retryCountRef = useRef(0);
  const seenIds = useRef(new Set<string>());

  const applyStatus = useCallback((next: LiveStatus) => {
    setStatus(next);
    if (next.error) setError(next.error);
  }, []);

  const loadStatus = useCallback(async () => {
    const response = await fetch("/api/demo/live/status", { cache: "no-store" });
    const body = (await response.json()) as EngineResponse;
    if (!response.ok || !body.success || !body.live)
      throw new Error(
        typeof body.error === "string"
          ? body.error
          : body.error?.message || "Live engine is unavailable.",
      );
    applyStatus(body.live);
  }, [applyStatus]);

  const closeEvents = useCallback(() => {
    if (retryRef.current !== null) window.clearTimeout(retryRef.current);
    retryRef.current = null;
    sourceRef.current?.close();
    sourceRef.current = null;
    setConnected(false);
  }, []);

  const connectEvents = useCallback(() => {
    closeEvents();
    const source = new EventSource("/api/demo/live/events");
    sourceRef.current = source;
    source.addEventListener("status", (raw) => {
      try {
        applyStatus(JSON.parse((raw as MessageEvent<string>).data) as LiveStatus);
        setConnected(true);
        retryCountRef.current = 0;
      } catch {
        setError("Live status update was invalid.");
      }
    });
    source.addEventListener("message", (raw) => {
      try {
        const event = JSON.parse((raw as MessageEvent<string>).data) as EngineEvent;
        if (!event.event_id || seenIds.current.has(event.event_id)) return;
        seenIds.current.add(event.event_id);
        if (seenIds.current.size > 256) {
          const first = seenIds.current.values().next().value;
          if (first) seenIds.current.delete(first);
        }
        setEvents((current) => [event, ...current].slice(0, 40));
      } catch {
        setError("Live event update was invalid.");
      }
    });
    source.onerror = () => {
      source.close();
      if (sourceRef.current !== source) return;
      setConnected(false);
      const attempt = retryCountRef.current++;
      if (attempt >= 5) {
        setError("Live event connection could not be restored.");
        return;
      }
      retryRef.current = window.setTimeout(connectEvents, Math.min(15000, 1000 * 2 ** attempt));
    };
  }, [applyStatus, closeEvents]);

  useEffect(() => {
    void loadStatus().catch((reason: unknown) =>
      setError(reason instanceof Error ? reason.message : "Live engine is unavailable."),
    );
    connectEvents();
    return closeEvents;
  }, [closeEvents, connectEvents, loadStatus]);

  useEffect(() => {
    if (status.state !== "running") return;
    const timer = window.setInterval(() => {
      void loadStatus().catch(() => undefined);
    }, 15000);
    return () => window.clearInterval(timer);
  }, [loadStatus, status.state]);

  const control = async (action: "start" | "stop") => {
    setBusy(true);
    setError("");
    setStreamError(false);
    try {
      const response = await fetch("/api/demo/live/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "start" && status.allowedCameraIndices[0] !== undefined
            ? { action, cameraIndex: status.allowedCameraIndices[0] }
            : { action },
        ),
      });
      const body = (await response.json()) as EngineResponse;
      if (!response.ok || !body.success || !body.live)
        throw new Error(
          typeof body.error === "string"
            ? body.error
            : body.error?.message || "Camera control failed.",
        );
      applyStatus(body.live);
      if (action === "start") connectEvents();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Camera control failed.");
    } finally {
      setBusy(false);
    }
  };

  const running = status.state === "running";
  const badge = running
    ? "bg-primary/15 text-primary"
    : status.state === "failed"
      ? "bg-destructive/10 text-destructive"
      : "bg-secondary text-muted-foreground";

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-5 rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/[.08] via-card to-card p-6 shadow-sm sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="eyebrow flex items-center gap-2"><Radio size={14} /> Station observation console</p>
          <h1 className="page-title">Live AI Demo</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
            A protected, local view of the shared Awareness Engine camera pipeline. Boxes, IDs, trajectories and zone events are live observations; they are not proof of physical disposal.
          </p>
        </div>
        <div className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${badge}`}>
          <span className={`h-2 w-2 rounded-full ${running ? "animate-pulse bg-primary" : "bg-current"}`} />
          {status.state === "running" ? "Camera live" : status.state}
        </div>
      </header>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 shrink-0" size={18} />
          <div><p className="font-semibold">Live demo unavailable</p><p className="mt-1 opacity-90">{error}</p></div>
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,.7fr)]">
        <div className="overflow-hidden rounded-3xl border bg-slate-950 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 text-slate-100">
            <div className="flex items-center gap-3"><Camera size={18} className="text-emerald-300" /><div><p className="text-sm font-semibold">Shared camera · {status.model}</p><p className="text-xs text-slate-400">MJPEG feed with real-time annotations</p></div></div>
            <span className="text-xs text-slate-400">{connected ? "SSE connected" : "reconnecting"}</span>
          </div>
          <div className="relative aspect-[4/3] bg-[radial-gradient(circle_at_50%_10%,rgba(52,211,153,.15),transparent_45%)]">
            {running && !streamError ? (
              // The source is a same-origin, authenticated route proxy. No engine host or key reaches the browser.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/api/demo/live/stream"
                alt="Live Awareness Engine camera feed with bottle tracking overlays"
                className="h-full w-full object-contain"
                onError={() => setStreamError(true)}
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center p-8 text-center text-slate-300">
                <div><WifiOff className="mx-auto mb-3 text-slate-500" size={32} /><p className="font-semibold">{streamError ? "Camera stream disconnected" : "Camera is not running"}</p><p className="mt-2 max-w-sm text-sm text-slate-500">Start the configured local camera to display live annotated frames. No image footage is stored by EcoP.</p></div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 border-t border-white/10 text-xs text-slate-300 sm:grid-cols-4">
            {[
              ["Camera", `${number(status.stats.camera_fps)} FPS`],
              ["Inference", `${number(status.stats.inference_fps)} FPS`],
              ["Latency", `${number(status.stats.end_to_end_latency_ms, 0)} ms`],
              ["Tracks", String(status.trackedBottles)],
            ].map(([label, value]) => <div className="p-4" key={label}><p className="text-slate-500">{label}</p><p className="mt-1 font-semibold text-slate-100">{value}</p></div>)}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="surface p-5">
            <div className="flex items-center gap-2"><Activity size={18} className="text-primary" /><h2 className="font-semibold">Live controls</h2></div>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">One pipeline is shared across viewers. Stop only ends this local camera process; it does not alter device registrations or rewards.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <button type="button" disabled={busy || running} onClick={() => void control("start")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"><Play size={17} />{busy && !running ? <LoaderCircle className="animate-spin" size={16} /> : "Start camera"}</button>
              <button type="button" disabled={busy || !running} onClick={() => void control("stop")} className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"><CircleStop size={17} />Stop camera</button>
              <button type="button" disabled={busy} onClick={() => { setError(""); setStreamError(false); void loadStatus().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Live engine is unavailable.")); connectEvents(); }} className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold disabled:opacity-50"><RefreshCw size={17} />Reconnect</button>
              <button type="button" onClick={() => { setEvents([]); seenIds.current.clear(); }} className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold"><Trash2 size={17} />Clear display</button>
            </div>
          </div>
          <div className="surface p-5">
            <div className="flex items-center gap-2"><Gauge size={18} className="text-primary" /><h2 className="font-semibold">Inference health</h2></div>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
              <div><dt className="text-muted-foreground">Average inference</dt><dd className="mt-1 font-semibold">{number(status.stats.average_inference_ms, 0)} ms</dd></div>
              <div><dt className="text-muted-foreground">Tracking</dt><dd className="mt-1 font-semibold">{number(status.stats.tracking_fps)} FPS</dd></div>
              <div><dt className="text-muted-foreground">Light</dt><dd className="mt-1 font-semibold">{status.quality?.low_light ? "Low · enhanced" : "Normal"}</dd></div>
              <div><dt className="text-muted-foreground">Last frame</dt><dd className="mt-1 font-semibold">{status.lastFrameAt ? new Date(status.lastFrameAt).toLocaleTimeString() : "—"}</dd></div>
            </dl>
          </div>
        </aside>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,.7fr)]">
        <div className="surface overflow-hidden">
          <div className="flex items-center justify-between border-b p-5"><div className="flex items-center gap-2"><ListVideo size={18} className="text-primary" /><h2 className="font-semibold">Actual engine events</h2></div><span className="text-xs text-muted-foreground">{events.length} shown</span></div>
          <div className="max-h-[30rem] divide-y overflow-auto">
            {events.length ? events.map((event) => <article key={event.event_id} className="p-4"><div className="flex items-start justify-between gap-3"><div><p className={`text-sm font-semibold ${eventTone(event)}`}>{event.event_type.replaceAll("_", " ")}{event.track_id !== null && event.track_id !== undefined ? ` · Track ${event.track_id}` : ""}</p><p className="mt-1 text-sm text-muted-foreground">{event.message}</p></div><time className="shrink-0 text-xs text-muted-foreground">{new Date(event.timestamp * 1000).toLocaleTimeString()}</time></div></article>) : <div className="p-8 text-center text-sm text-muted-foreground">Start the camera to receive real detector, tracking, zone and uncertainty events.</div>}
          </div>
        </div>
        <div className="rounded-3xl border border-primary/20 bg-primary/[.05] p-6">
          <div className="flex items-center gap-2 text-primary"><ShieldCheck size={20} /><h2 className="font-semibold">Reward safety boundary</h2></div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">This page is observation-only. A box, trajectory, zone dwell or candidate event never changes an EcoP balance.</p>
          <dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Session verification</dt><dd className="font-semibold">{status.sessionVerification.replaceAll("_", " ")}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Points awarded here</dt><dd className="font-semibold">{status.pointsAwarded}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Review updates</dt><dd className="font-semibold">{status.reviewUpdates}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Vision candidates</dt><dd className="font-semibold">{status.candidateDisposals}</dd></div></dl>
          <div className="mt-6 rounded-2xl border border-primary/15 bg-background/70 p-4 text-xs leading-5 text-muted-foreground"><Bot className="mb-2 text-primary" size={17} />A registered station can separately send one signed v2, QR/session-bound event through the device gateway. EcoP then performs replay checks and adjudication before any review or reward action.</div>
        </div>
      </section>

      <p className="flex items-center gap-2 text-xs text-muted-foreground"><TimerReset size={15} />No footage is retained by this view. Current camera selection: {status.cameraIndex ?? "not started"}; allowed local indices: {status.allowedCameraIndices.join(", ") || "not available"}.</p>
    </div>
  );
}
