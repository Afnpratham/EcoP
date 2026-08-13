"use client";

import { motion } from "framer-motion";
import {
  Camera,
  Shield,
  Zap,
  Gift,
  BarChart3,
  Users,
} from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "AI Verification",
    description:
      "Computer vision confirms every disposal in real-time. No manual review, no cheating.",
  },
  {
    icon: Zap,
    title: "Instant Points",
    description:
      "Earn Eco Points the moment AI verifies your responsible disposal at any smart bin.",
  },
  {
    icon: Gift,
    title: "Real Rewards",
    description:
      "Redeem points for coffee, merchandise, tree planting, and more — all on campus.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description:
      "No face recognition. No stored imagery. Disposals are linked only through your voluntary QR session.",
  },
  {
    icon: BarChart3,
    title: "Impact Dashboard",
    description:
      "Track your environmental impact with beautiful charts showing bottles recycled and CO₂ saved.",
  },
  {
    icon: Users,
    title: "Campus Leaderboard",
    description:
      "Compete with peers, earn achievement badges, and climb the university leaderboard.",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

export function LandingFeatures() {
  return (
    <section className="border-t border-border bg-secondary/30 py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to go green
          </h2>
          <p className="mt-4 text-muted-foreground">
            EcoP combines AI, gamification, and campus infrastructure to make
            sustainability rewarding and effortless.
          </p>
        </div>

        <motion.div
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-md"
              variants={cardVariants}
            >
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
