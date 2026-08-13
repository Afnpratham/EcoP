"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "Sneha Patel",
    role: "2nd Year, Computer Science",
    quote:
      "EcoP made me actually excited about recycling. The gamification is brilliant — I'm in a friendly competition with my hostel mates now!",
  },
  {
    name: "Dr. Rajesh Kumar",
    role: "Professor, Environmental Sciences",
    quote:
      "As faculty, I love that EcoP uses real AI verification. It's not just another feel-good app — the data is genuine and the impact measurable.",
  },
  {
    name: "Fatima Shaikh",
    role: "3rd Year, Mechanical Engineering",
    quote:
      "I've redeemed three coffee vouchers and got a reusable bottle. The rewards make sustainability feel tangible and rewarding.",
  },
];

export function LandingTestimonials() {
  return (
    <section className="border-t border-border bg-secondary/30 py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            What the Community Says
          </h2>
          <p className="mt-4 text-muted-foreground">
            Hear from students and faculty already making an impact.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              className="rounded-xl border border-border bg-card p-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                delay: i * 0.1,
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <div className="mb-4 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-5 flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs">
                    {t.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
