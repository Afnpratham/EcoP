"use client";

import * as React from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  /** Render `value` through this before display (e.g. grams → kg). */
  format?: (n: number) => string;
  icon?: React.ReactNode;
  suffix?: string;
  className?: string;
  animate?: boolean;
}

/**
 * Stat tile with an optional tick-up animation. Respects prefers-reduced-motion
 * (the spring settles instantly via Framer's default behavior).
 */
export function StatCard({
  label,
  value,
  format,
  icon,
  suffix,
  className,
  animate = true,
}: StatCardProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  const mv = useMotionValue(0);
  const spring = useSpring(mv, { duration: 900, bounce: 0 });
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    if (inView) mv.set(value);
  }, [inView, value, mv]);

  React.useEffect(() => {
    return spring.on("change", (v) => setDisplay(v));
  }, [spring]);

  const shown = animate ? display : value;
  const text = format ? format(shown) : Math.round(shown).toLocaleString();

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {icon ? (
          <span className="text-primary [&_svg]:h-4 [&_svg]:w-4">{icon}</span>
        ) : null}
      </div>
      <p className="mt-2 font-display text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
        {text}
        {suffix ? <span className="ml-1 text-base font-medium">{suffix}</span> : null}
      </p>
    </div>
  );
}
