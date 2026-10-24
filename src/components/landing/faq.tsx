"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "How does EcoP verify disposals?",
    a: "EcoP uses a computer-vision service called the Awareness Engine. When you start a disposal session by scanning a bin's QR code, the camera near the bin detects and verifies the type of item disposed. Rewards follow the configured evidence policy or an authorized human review.",
  },
  {
    q: "Is my privacy protected?",
    a: "EcoP does not perform face recognition. This app stores structured evidence receipts; ask your operator about local camera and log retention. Disposal events are linked to your account only through the voluntary QR session you create — no biometric data is collected.",
  },
  {
    q: "What can I redeem Eco Points for?",
    a: "Points can be redeemed for campus rewards like free coffee, stickers, reusable bottles, t-shirts, library fee waivers, or even having a tree planted in your name on campus.",
  },
  {
    q: "Who can use EcoP?",
    a: "Anyone on campus — students, faculty, and visitors can all register and start earning points. Students and faculty simply provide their SAP ID during registration.",
  },
  {
    q: "What happens if the AI makes a mistake?",
    a: "Uncertain evidence is saved for review without an automatic penalty. Open your receipt in Impact to submit an appeal. An authorized reviewer records the decision and explanation.",
  },
  {
    q: "Can I cheat the system?",
    a: "Device signatures, session binding, duplicate checks and rate limits reduce abuse. Computer vision has limits, particularly under occlusion or ambiguous attribution; uncertain evidence is reviewed.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left text-sm font-medium transition-colors hover:text-primary"
      >
        {q}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm leading-relaxed text-muted-foreground">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function LandingFAQ() {
  return (
    <section id="faq" className="py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-muted-foreground">
            Everything you need to know about EcoP.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-2xl rounded-xl border border-border bg-card px-6">
          {faqs.map((faq) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>
    </section>
  );
}
