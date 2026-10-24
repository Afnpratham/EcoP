"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

export function LandingCTA() {
  return (
    <section className="border-t border-border bg-secondary/30 py-24">
      <div className="container">
        <motion.div
          className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-12 text-center"
          initial={false}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Decorative glow */}
          <div className="pointer-events-none absolute -top-12 left-1/2 h-40 w-80 -translate-x-1/2 rounded-full bg-primary/20 blur-[80px]" />

          <div className="relative">
            <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
              <Leaf className="h-7 w-7" />
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to make an impact?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Join thousands of students and faculty turning everyday recycling
              into real rewards. Sign up in 30 seconds.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="gap-2 shadow-glow">
                <Link href={ROUTES.REGISTER}>
                  Create Account
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={ROUTES.LOGIN}>Sign In</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
