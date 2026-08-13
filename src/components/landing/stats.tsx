"use client";

import { motion } from "framer-motion";
import { StatCard } from "@/components/shared/stat-card";
import { Recycle, Droplets, TreePine, Flame } from "lucide-react";

export function LandingStats() {
  return (
    <section id="impact" className="border-t border-border bg-secondary/30 py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Live Impact Statistics
          </h2>
          <p className="mt-4 text-muted-foreground">
            Real numbers from the EcoP community. Every bottle counts.
          </p>
        </div>

        <motion.div
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <StatCard
            label="Bottles Recycled"
            value={12847}
            icon={<Recycle />}
          />
          <StatCard
            label="CO₂ Saved"
            value={694}
            suffix="kg"
            icon={<Droplets />}
          />
          <StatCard
            label="Trees Planted"
            value={47}
            icon={<TreePine />}
          />
          <StatCard
            label="Active Streaks"
            value={328}
            icon={<Flame />}
          />
        </motion.div>
      </div>
    </section>
  );
}
