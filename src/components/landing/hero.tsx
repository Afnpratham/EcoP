import Link from "next/link";
import {
  ArrowUpRight,
  ScanLine,
  Leaf,
  ArrowDown,
  Check,
  Recycle,
  Droplets,
} from "lucide-react";
export function LandingHero() {
  return (
    <section className="container grid gap-12 py-14 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-24">
      <div>
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium">
          <span className="h-2 w-2 rounded-full bg-primary" /> A better habit. A
          lighter footprint.
        </div>
        <h1 className="max-w-2xl font-display text-6xl font-semibold leading-[1.03] tracking-[-.055em] sm:text-7xl lg:text-[5.5rem]">
          Small actions.
          <br />
          <span className="text-primary">Real possibility.</span>
        </h1>
        <p className="mt-7 max-w-lg text-lg leading-relaxed text-muted-foreground">
          Recycle with confidence. Refill with purpose. Turn everyday choices
          into rewards, with a clear record of what happens next.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/stations"
            className="inline-flex items-center gap-8 rounded-full bg-primary px-6 py-4 font-semibold text-primary-foreground"
          >
            Find a station
            <ArrowUpRight size={20} />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-3 rounded-full border px-6 py-4 font-medium"
          >
            Your impact
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <p className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
          <ScanLine size={15} /> Session-based attribution. No face recognition.
        </p>
      </div>
      <div className="relative rounded-[2rem] bg-[#123e32] p-6 text-white sm:p-9">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-[.2em] text-emerald-200">
            The circular everyday
          </span>
          <Leaf size={22} className="text-[#d4ed9a]" />
        </div>
        <div className="my-9 flex items-center justify-center gap-5">
          <div className="relative flex h-64 w-40 flex-col items-center justify-center rounded-[3rem] border border-white/20 bg-white/10">
            <div className="absolute -top-3 h-6 w-16 rounded-t-xl bg-[#d4ed9a]" />
            <Recycle size={48} strokeWidth={1.2} className="text-[#d4ed9a]" />
            <span className="mt-4 text-xs uppercase tracking-[.2em]">
              One more life
            </span>
            <div className="absolute bottom-7 h-px w-20 bg-white/20" />
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl bg-[#d4ed9a] p-5 text-[#173e31]">
              <Droplets size={24} />
              <p className="mt-6 text-xl font-semibold">Reuse first.</p>
              <p className="mt-1 text-xs">Less to throw away.</p>
            </div>
            <div className="rounded-2xl border border-white/15 p-4">
              <div className="flex items-center gap-2 text-sm">
                <Check size={17} className="text-[#d4ed9a]" /> Evidence matters
              </div>
              <p className="mt-2 max-w-32 text-xs leading-relaxed text-emerald-100/80">
                A receipt for the action.
                <br />A path for the material.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-white/15 pt-5 text-sm text-emerald-100">
          <span>Dispose → verify → collect → accept</span>
          <ArrowDown size={18} />
        </div>
        <div className="absolute -bottom-4 right-8 rounded-full bg-[#eacbb5] px-5 py-2.5 text-xs font-semibold text-[#403329]">
          Designed for progress, every day.
        </div>
      </div>
    </section>
  );
}
