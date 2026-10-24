"use client";

import { motion } from "framer-motion";
import { QrCode, Camera, Award, Gift } from "lucide-react";

const steps = [
  {
    icon: QrCode,
    title: "Scan the Bin",
    description:
      "Walk up to any EcoP smart bin on campus and scan its QR code with your phone camera.",
    color: "from-emerald-500 to-green-400",
  },
  {
    icon: Camera,
    title: "Dispose Responsibly",
    description:
      "Place your recyclable item in the bin. The Awareness Engine verifies it in real time.",
    color: "from-teal-500 to-cyan-400",
  },
  {
    icon: Award,
    title: "Earn Eco Points",
    description:
      "Points are credited after sufficient evidence or an authorized human review.",
    color: "from-green-500 to-emerald-400",
  },
  {
    icon: Gift,
    title: "Redeem Rewards",
    description:
      "Exchange your Eco Points for real campus rewards — coffee, merch, or plant a tree.",
    color: "from-lime-500 to-green-400",
  },
];

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            How EcoP Works
          </h2>
          <p className="mt-4 text-muted-foreground">
            Four simple steps to turn your recyclables into rewards.
          </p>
        </div>

        <div className="relative mt-16">
          {/* Connector line */}
          <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-primary/20 via-primary/40 to-primary/20 lg:block" />

          <div className="grid gap-12 lg:gap-0">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                className={`flex flex-col items-center gap-8 lg:flex-row ${
                  i % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`}
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <div className="flex-1 text-center lg:text-left">
                  <div className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-primary">
                    Step {i + 1}
                  </div>
                  <h3 className="font-display text-xl font-semibold">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    {step.description}
                  </p>
                </div>

                {/* Center circle */}
                <div className="relative z-10 flex-shrink-0">
                  <div
                    className={`grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br ${step.color} text-white shadow-lg`}
                  >
                    <step.icon className="h-7 w-7" />
                  </div>
                </div>

                <div className="flex-1" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
